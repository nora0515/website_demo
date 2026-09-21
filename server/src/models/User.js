import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phone_number: {
      type: String,
      required: true,
      trim: true,
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
    user_type: {
      type: String,
      required: true,
      enum: ['customer', 'admin'],
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

export default User;
