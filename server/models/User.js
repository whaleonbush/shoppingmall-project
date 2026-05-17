import mongoose from 'mongoose';

const userTypeValues = ['customer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    'user-type': {
      type: String,
      enum: userTypeValues,
      default: 'customer',
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);
