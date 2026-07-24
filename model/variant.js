import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    option: {
      type: String,
      required: true,
      trim: true,
    },
    priceAdd: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const variantModel = mongoose.model("variant", variantSchema);
export default variantModel;
