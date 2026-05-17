import mongoose from 'mongoose';
import { ProductOption } from '../models/ProductOption.js';

const DEFAULT_PAGE_LIMIT = 2;
const MAX_PAGE_LIMIT = 100;

const ALLOWED_FIELDS = [
  'product_id',
  'product_name',
  'option_name',
  'product_category',
  'sub_category',
  'additional_price',
  'price',
  'stock_quantity',
  'sku',
  'option_image_url',
];

function pickAllowed(body) {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  // Empty strings should behave like SQL NULL for nullable unique fields.
  if (data.sku === '') data.sku = null;
  if (data.option_image_url === '') data.option_image_url = null;

  return data;
}

function buildIdFilter(id) {
  if (/^\d+$/.test(id)) {
    return { option_id: Number(id) };
  }

  if (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  ) {
    return { _id: id };
  }

  return null;
}

function handleError(res, err) {
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      ),
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate key',
      keys: err.keyValue,
    });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}

export async function createProductOption(req, res) {
  try {
    const created = await ProductOption.create(pickAllowed(req.body ?? {}));
    return res.status(201).json(created);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function listProductOptions(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_LIMIT)
    );
    const filter = {};

    if (req.query.product_id !== undefined) {
      filter.product_id = Number(req.query.product_id);
    }
    if (req.query.product_name) {
      filter.product_name = new RegExp(String(req.query.product_name).trim(), 'i');
    }
    if (req.query.product_category) {
      filter.product_category = String(req.query.product_category);
    }
    if (req.query.sub_category) {
      filter.sub_category = String(req.query.sub_category);
    }
    if (req.query.sku) {
      filter.sku = String(req.query.sku).trim();
    }

    const [items, total] = await Promise.all([
      ProductOption.find(filter)
        .sort({ option_id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ProductOption.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      items,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (err) {
    return handleError(res, err);
  }
}

export async function getProductOptionById(req, res) {
  try {
    const filter = buildIdFilter(req.params.id);
    if (!filter) return res.status(400).json({ message: 'Invalid id' });

    const option = await ProductOption.findOne(filter);
    if (!option) {
      return res.status(404).json({ message: 'Product option not found' });
    }

    return res.json(option);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function updateProductOption(req, res) {
  try {
    const filter = buildIdFilter(req.params.id);
    if (!filter) return res.status(400).json({ message: 'Invalid id' });

    const updated = await ProductOption.findOneAndUpdate(
      filter,
      pickAllowed(req.body ?? {}),
      { new: true, runValidators: true, context: 'query' }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Product option not found' });
    }

    return res.json(updated);
  } catch (err) {
    return handleError(res, err);
  }
}

export async function deleteProductOption(req, res) {
  try {
    const filter = buildIdFilter(req.params.id);
    if (!filter) return res.status(400).json({ message: 'Invalid id' });

    const deleted = await ProductOption.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ message: 'Product option not found' });
    }

    return res.json({ message: 'Deleted', item: deleted });
  } catch (err) {
    return handleError(res, err);
  }
}
