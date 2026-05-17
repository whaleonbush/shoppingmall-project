import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { versionKey: false }
);

const Counter =
  mongoose.models.Counter ?? mongoose.model('Counter', counterSchema);

const productOptionSchema = new mongoose.Schema(
  {
    option_id: {
      type: Number,
      unique: true,
      immutable: true,
    },
    product_id: {
      type: Number,
    },
    product_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    option_name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    product_category: {
      type: String,
      enum: ['men', 'women', 'unisex'],
      default: 'men',
      required: true,
    },
    sub_category: {
      type: String,
      enum: ['상의', '하의', '악세사리'],
      default: '상의',
      required: true,
    },
    additional_price: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
    option_image_url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  { timestamps: true }
);

productOptionSchema.index(
  { sku: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sku: { $type: 'string', $ne: '' },
    },
  }
);

productOptionSchema.pre('validate', async function setAutoIncrementOptionId() {
  if (this.option_id !== undefined && this.option_id !== null) return;

  const counter = await Counter.findByIdAndUpdate(
    'product_option_option_id',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.option_id = counter.seq;
});

export const ProductOption =
  mongoose.models.ProductOption ??
  mongoose.model('ProductOption', productOptionSchema);
