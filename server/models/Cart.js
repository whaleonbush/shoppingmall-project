import mongoose from 'mongoose';

/**
 * Cart item subdocument: a single line entry in a user's cart.
 *
 * - option_id: references ProductOption.option_id (auto-incremented number)
 * - quantity:  how many of this option are in the cart (>= 1)
 * - size:      optional size label (e.g. "M", "L"); kept as string so it can
 *              hold both clothing sizes and numeric sizes
 * - added_at:  set when the line is first added
 */
const cartItemSchema = new mongoose.Schema(
  {
    option_id: {
      type: Number,
      required: true,
      ref: 'ProductOption',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    size: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null,
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Cart schema: one document per user.
 *
 * - user:  ObjectId ref to User; unique so each user has exactly one cart
 * - items: array of cart items
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

/**
 * Prevent the same (option_id, size) combo from existing twice in a cart.
 * If the user adds the same option in the same size, callers should bump
 * the existing item's quantity instead of pushing a duplicate row.
 */
cartSchema.pre('save', function ensureUniqueCartItems(next) {
  if (!Array.isArray(this.items)) return next();

  const seen = new Set();
  for (const item of this.items) {
    const key = `${item.option_id}::${item.size ?? ''}`;
    if (seen.has(key)) {
      return next(
        new mongoose.Error.ValidationError(
          new mongoose.Error.ValidatorError({
            path: 'items',
            message:
              'Duplicate cart item: same option_id and size combination is not allowed.',
          })
        )
      );
    }
    seen.add(key);
  }

  next();
});

export const Cart =
  mongoose.models.Cart ?? mongoose.model('Cart', cartSchema);
