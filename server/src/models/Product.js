import mongoose from 'mongoose';

export const CATEGORIES = ['중문', '도어', '인테리어 필름'];

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      // Stored uppercase so "ab-1" and "AB-1" cannot both be registered.
      uppercase: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'price must be a whole number of won.',
      },
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    image: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const Product = mongoose.model('Product', productSchema);

export default Product;
