import mongoose from 'mongoose';
import { Cart } from '../models/Cart.js';
import { ProductOption } from '../models/ProductOption.js';

const MAX_QUANTITY = 999;

/** Treat null/undefined/'' as the same "no size" value when matching items. */
function normalizeSize(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v === '' ? null : v;
}

function toPositiveInt(value, fallback = NaN) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function findItemIndex(cart, optionId, size) {
  const target = normalizeSize(size);
  return cart.items.findIndex(
    (it) => it.option_id === optionId && normalizeSize(it.size) === target
  );
}

/**
 * Fetch matching ProductOptions for the items in a cart and return a
 * "view model": each item enriched with current price/name/image plus a
 * computed total. Items that point to a deleted product fall back to a
 * stub so the client can still render and let the user remove them.
 */
async function enrichCart(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  if (items.length === 0) {
    return {
      _id: cart?._id,
      user: cart?.user,
      items: [],
      total: 0,
      total_quantity: 0,
      createdAt: cart?.createdAt,
      updatedAt: cart?.updatedAt,
    };
  }

  const optionIds = [...new Set(items.map((it) => it.option_id))];
  const products = await ProductOption.find({ option_id: { $in: optionIds } });
  const byOptionId = new Map(products.map((p) => [p.option_id, p]));

  let total = 0;
  let totalQuantity = 0;

  const enriched = items.map((item) => {
    const product = byOptionId.get(item.option_id);
    const price =
      (Number(product?.price) || 0) + (Number(product?.additional_price) || 0);
    const subtotal = price * item.quantity;
    total += subtotal;
    totalQuantity += item.quantity;

    return {
      option_id: item.option_id,
      quantity: item.quantity,
      size: item.size ?? null,
      added_at: item.added_at,
      product: product
        ? {
            option_id: product.option_id,
            product_name: product.product_name,
            option_name: product.option_name,
            product_category: product.product_category,
            sub_category: product.sub_category,
            price: product.price,
            additional_price: product.additional_price,
            stock_quantity: product.stock_quantity,
            sku: product.sku,
            option_image_url: product.option_image_url,
          }
        : null,
      unit_price: price,
      subtotal,
      product_missing: !product,
    };
  });

  return {
    _id: cart._id,
    user: cart.user,
    items: enriched,
    total,
    total_quantity: totalQuantity,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

/**
 * Fetch the caller's cart, creating an empty one on first access.
 * Always returns a saved (or upserted) document.
 */
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

function handleError(res, err) {
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '입력값이 올바르지 않습니다.',
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      ),
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: '이미 동일한 장바구니가 존재합니다.',
      keys: err.keyValue,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res
      .status(400)
      .json({ success: false, message: '잘못된 식별자 형식입니다.' });
  }

  console.error('[cart] error:', err);
  return res
    .status(500)
    .json({ success: false, message: '서버 오류가 발생했습니다.' });
}

/**
 * GET /api/cart
 * Returns the caller's cart with each item enriched with product info.
 */
export async function getMyCart(req, res) {
  try {
    const cart = await getOrCreateCart(req.auth.sub);
    const view = await enrichCart(cart);
    return res.json({ success: true, cart: view });
  } catch (err) {
    return handleError(res, err);
  }
}

/**
 * POST /api/cart/items
 * Body: { option_id: number, quantity?: number (>=1), size?: string|null }
 *
 * Adds a new item, or increments quantity if (option_id, size) already exists.
 */
export async function addCartItem(req, res) {
  try {
    const rawOptionId = req.body?.option_id;
    const optionId = Number(rawOptionId);
    if (!Number.isFinite(optionId) || optionId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'option_id는 양수여야 합니다.' });
    }

    const quantity = toPositiveInt(req.body?.quantity, 1) || 1;
    if (quantity < 1 || quantity > MAX_QUANTITY) {
      return res
        .status(400)
        .json({ success: false, message: `수량은 1~${MAX_QUANTITY} 사이여야 합니다.` });
    }

    const size = normalizeSize(req.body?.size);

    const product = await ProductOption.findOne({ option_id: optionId });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: '해당 상품을 찾을 수 없습니다.' });
    }

    const cart = await getOrCreateCart(req.auth.sub);
    const idx = findItemIndex(cart, optionId, size);

    if (idx >= 0) {
      const next = cart.items[idx].quantity + quantity;
      if (next > MAX_QUANTITY) {
        return res.status(400).json({
          success: false,
          message: `한 상품은 최대 ${MAX_QUANTITY}개까지만 담을 수 있습니다.`,
        });
      }
      cart.items[idx].quantity = next;
    } else {
      cart.items.push({ option_id: optionId, quantity, size });
    }

    await cart.save();

    const view = await enrichCart(cart);
    return res.status(201).json({ success: true, cart: view });
  } catch (err) {
    return handleError(res, err);
  }
}

/**
 * PATCH /api/cart/items/:option_id
 * Body: { quantity?: number, size?: string|null, new_size?: string|null }
 *
 * - `size` selects which line to update (defaults to no size).
 * - `quantity` sets the new quantity (>= 1). Set to 0 to remove.
 * - `new_size` optionally replaces the size of the line; if the target
 *   (option_id, new_size) line already exists, the controller refuses
 *   with 409 to avoid silent duplicate merging.
 */
export async function updateCartItem(req, res) {
  try {
    const optionId = Number(req.params.option_id);
    if (!Number.isFinite(optionId) || optionId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'option_id가 올바르지 않습니다.' });
    }

    const size = normalizeSize(req.body?.size);
    const hasQuantity = req.body?.quantity !== undefined;
    const hasNewSize = Object.prototype.hasOwnProperty.call(
      req.body ?? {},
      'new_size'
    );

    if (!hasQuantity && !hasNewSize) {
      return res
        .status(400)
        .json({ success: false, message: '수정할 값이 없습니다.' });
    }

    const cart = await getOrCreateCart(req.auth.sub);
    const idx = findItemIndex(cart, optionId, size);
    if (idx < 0) {
      return res
        .status(404)
        .json({ success: false, message: '장바구니에 해당 항목이 없습니다.' });
    }

    if (hasQuantity) {
      const quantity = toPositiveInt(req.body.quantity, NaN);
      if (!Number.isFinite(quantity)) {
        return res
          .status(400)
          .json({ success: false, message: 'quantity는 숫자여야 합니다.' });
      }
      if (quantity > MAX_QUANTITY) {
        return res.status(400).json({
          success: false,
          message: `수량은 ${MAX_QUANTITY}개를 넘을 수 없습니다.`,
        });
      }
      if (quantity === 0) {
        cart.items.splice(idx, 1);
      } else {
        cart.items[idx].quantity = quantity;
      }
    }

    if (hasNewSize && cart.items[idx]) {
      const newSize = normalizeSize(req.body.new_size);
      const duplicateIdx = cart.items.findIndex(
        (it, i) =>
          i !== idx &&
          it.option_id === optionId &&
          normalizeSize(it.size) === newSize
      );
      if (duplicateIdx >= 0) {
        return res.status(409).json({
          success: false,
          message: '동일한 옵션과 사이즈가 이미 장바구니에 있습니다.',
        });
      }
      cart.items[idx].size = newSize;
    }

    await cart.save();

    const view = await enrichCart(cart);
    return res.json({ success: true, cart: view });
  } catch (err) {
    return handleError(res, err);
  }
}

/**
 * DELETE /api/cart/items/:option_id?size=...
 * Removes the cart line that matches (option_id, size).
 */
export async function removeCartItem(req, res) {
  try {
    const optionId = Number(req.params.option_id);
    if (!Number.isFinite(optionId) || optionId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'option_id가 올바르지 않습니다.' });
    }

    const size = normalizeSize(req.query?.size ?? req.body?.size);

    const cart = await getOrCreateCart(req.auth.sub);
    const idx = findItemIndex(cart, optionId, size);
    if (idx < 0) {
      return res
        .status(404)
        .json({ success: false, message: '장바구니에 해당 항목이 없습니다.' });
    }

    cart.items.splice(idx, 1);
    await cart.save();

    const view = await enrichCart(cart);
    return res.json({ success: true, cart: view });
  } catch (err) {
    return handleError(res, err);
  }
}

/**
 * DELETE /api/cart
 * Clears all items in the caller's cart.
 */
export async function clearCart(req, res) {
  try {
    const cart = await getOrCreateCart(req.auth.sub);
    cart.items = [];
    await cart.save();

    const view = await enrichCart(cart);
    return res.json({ success: true, cart: view });
  } catch (err) {
    return handleError(res, err);
  }
}
