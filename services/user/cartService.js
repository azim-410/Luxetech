import cartModel from "../../model/cart.js";
import productModel from "../../model/product.js";
import variantModel from "../../model/variant.js";
import wishlistModel from "../../model/wishlist.js";

// Max quantity a single customer can purchase per variant
const MAX_ITEM_LIMIT = 5;

const addToCartService = async (
  userId,
  productId,
  variantId,
  quantityInput,
) => {
  try {
    const quantity = parseInt(quantityInput) || 1;
    if (quantity <= 0) {
      return { success: false, message: "Quantity must be at least 1." };
    }

    // Validate product
    const product = await productModel.findById(productId);
    if (!product || product.isDeleted || product.isHidden) {
      return { success: false, message: "Product not found or unavailable." };
    }

    // Validate variant
    let variant = null;
    if (variantId) {
      variant = await variantModel.findById(variantId);
      if (!variant || variant.productId.toString() !== productId.toString()) {
        return {
          success: false,
          message: "Selected product variant not found.",
        };
      }
    } else {
      variant = await variantModel.findOne({ productId: productId });
      if (!variant) {
        return { success: false, message: "Product variant not found." };
      }
    }

    // Check stock
    const stockAvailable = variant ? variant.stock : 0;

    // Find or create cart
    let cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
      cart = new cartModel({ userId: userId, items: [] });
    }

    // Find if item already exists in the cart
    const existingItem = cart.items.find((item) => {
      const sameProduct = item.productId.toString() === productId.toString();
      const sameVariant =
        (!item.variantId && !variantId) ||
        (item.variantId &&
          variantId &&
          item.variantId.toString() === variantId.toString());
      return sameProduct && sameVariant;
    });

    const currentQty = existingItem ? existingItem.quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > MAX_ITEM_LIMIT) {
      return {
        success: false,
        message: `You can only have up to ${MAX_ITEM_LIMIT} units of this item in your cart. You already have ${currentQty} units.`,
      };
    }

    if (newQty > stockAvailable) {
      if (stockAvailable === 0) {
        return {
          success: false,
          message: "This product is out of stock.",
        };
      }
      return {
        success: false,
        message: `Cannot add more units. Only ${stockAvailable} unit(s) available in stock, and you already have ${currentQty} in your cart.`,
      };
    }

    if (existingItem) {
      existingItem.quantity = newQty;
    } else {
      cart.items.push({
        productId: productId,
        variantId: variantId || null,
        quantity: quantity,
      });
    }

    await cart.save();
    return { success: true, message: "Product added to cart successfully." };
  } catch (error) {
    console.error("addToCartService error:", error);
    throw error;
  }
};

const getCartService = async (userId) => {
  try {
    const cart = await cartModel
      .findOne({ userId: userId })
      .populate({
        path: "items.productId",
        populate: { path: "category" },
      })
      .populate("items.variantId");

    let cartItems = [];
    let originalTotal = 0;
    let subtotal = 0;
    let totalItemsCount = 0;

    if (cart && cart.items) {
      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        const product = item.productId;
        const variant = item.variantId;

        const isProductUnavailable =
          !product || product.isDeleted || product.isHidden;
        const isVariantUnavailable = variant
          ? variant.status === false || variant.isDeleted === true
          : false;
        const isUnavailable = isProductUnavailable || isVariantUnavailable;

        const priceAdd = variant ? variant.priceAdd : 0;
        const productBasePrice = product ? product.basePrice + priceAdd : 0;

        let baseDiscountedPrice = product
          ? (product.discountedPrice > 0
              ? product.discountedPrice
              : product.basePrice) + priceAdd
          : 0;

        // Category-level offer deduction
        let categoryOfferPrice = 0;
        if (product && product.category) {
          const category = product.category;
          if (
            category.status !== false &&
            category.isHidden !== true &&
            category.categoryOfferPrice > 0
          ) {
            categoryOfferPrice = category.categoryOfferPrice;
          }
        }
        const productDiscountedPrice = Math.max(
          0,
          baseDiscountedPrice - categoryOfferPrice,
        );

        const itemOriginalTotal = productBasePrice * item.quantity;
        const itemSubtotal = productDiscountedPrice * item.quantity;

        if (!isUnavailable) {
          originalTotal += itemOriginalTotal;
          subtotal += itemSubtotal;
          totalItemsCount += item.quantity;
        }

        let firstImage = "";
        if (variant && variant.images && variant.images.length > 0) {
          firstImage = variant.images[0];
        }

        const totalStockForUser = variant ? variant.stock : 0;

        cartItems.push({
          productId: product ? product._id : item.productId,
          categoryId: product
            ? product.category
              ? product.category._id || product.category
              : null
            : null,
          variantId: variant ? variant._id : item.variantId,
          name: product ? product.name : "Unknown Product",
          variantName: variant ? `${variant.groupName}: ${variant.option}` : "",
          quantity: item.quantity,
          stock: totalStockForUser,
          maxAllowed: Math.min(MAX_ITEM_LIMIT, totalStockForUser),
          basePrice: productBasePrice,
          discountedPrice: productDiscountedPrice,
          subtotal: itemSubtotal,
          image: firstImage,
          isUnavailable: isUnavailable,
        });
      }
    }

    const discount = originalTotal - subtotal;
    const tax = Math.round(subtotal * 0.08); // 8% tax
    const grandTotal = subtotal + tax;

    return {
      items: cartItems,
      originalTotal: originalTotal,
      discount: discount,
      subtotal: subtotal,
      tax: tax,
      grandTotal: grandTotal,
      totalItems: totalItemsCount,
    };
  } catch (error) {
    console.error("getCartService error:", error);
    throw error;
  }
};

const updateCartQuantityService = async (
  userId,
  productId,
  variantId,
  newQuantityInput,
) => {
  try {
    console.log("--- updateCartQuantityService called ---");
    console.log(
      "productId:",
      productId,
      "variantId:",
      variantId,
      "newQuantityInput:",
      newQuantityInput,
    );
    const newQuantity = parseInt(newQuantityInput);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      return { success: false, message: "Quantity must be at least 1." };
    }

    if (newQuantity > MAX_ITEM_LIMIT) {
      return {
        success: false,
        message: `Cannot set quantity to ${newQuantity}. Maximum available purchase limit is ${MAX_ITEM_LIMIT} units.`,
      };
    }

    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
      return { success: false, message: "Cart not found." };
    }
    console.log(
      "Found cart.items:",
      cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    );

    // Find the item in the cart
    const cartItem = cart.items.find((item) => {
      const sameProduct = item.productId.toString() === productId.toString();
      const sameVariant =
        (!item.variantId && !variantId) ||
        (item.variantId &&
          variantId &&
          item.variantId.toString() === variantId.toString());
      return sameProduct && sameVariant;
    });

    if (!cartItem) {
      return { success: false, message: "Item not found in cart." };
    }

    const currentQty = cartItem.quantity;
    const diff = newQuantity - currentQty;

    if (variantId) {
      const variant = await variantModel.findById(variantId);
      if (!variant) {
        return { success: false, message: "Product variant not found." };
      }
      if (variant.stock < newQuantity) {
        return {
          success: false,
          message: `Cannot set quantity to ${newQuantity}. Only ${variant.stock} unit(s) available in stock.`,
        };
      }
    }

    cartItem.quantity = newQuantity;
    await cart.save();
    return { success: true, message: "Quantity updated successfully." };
  } catch (error) {
    console.error("updateCartQuantityService error:", error);
    throw error;
  }
};

const removeFromCartService = async (userId, productId, variantId) => {
  try {
    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
      return { success: false, message: "Cart not found." };
    }

    // Find the item to get its quantity
    const itemToRemove = cart.items.find((item) => {
      const sameProduct = item.productId.toString() === productId.toString();
      const sameVariant =
        (!item.variantId && !variantId) ||
        (item.variantId &&
          variantId &&
          item.variantId.toString() === variantId.toString());
      return sameProduct && sameVariant;
    });

    cart.items = cart.items.filter((item) => {
      const sameProduct = item.productId.toString() === productId.toString();
      const sameVariant =
        (!item.variantId && !variantId) ||
        (item.variantId &&
          variantId &&
          item.variantId.toString() === variantId.toString());
      return !(sameProduct && sameVariant);
    });

    await cart.save();
    return { success: true, message: "Item removed from cart." };
  } catch (error) {
    console.error("removeFromCartService error:", error);
    throw error;
  }
};

const addAllFromWishlistToCartService = async (userId) => {
  try {
    const wishlist = await wishlistModel
      .findOne({ userId: userId })
      .populate("products.productId")
      .populate("products.variantId");

    if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
      return { success: false, message: "Your wishlist is empty." };
    }

    const activeWishlistItems = wishlist.products.filter(
      (item) => item.isActive !== false,
    );
    if (activeWishlistItems.length === 0) {
      return { success: false, message: "Your wishlist is empty." };
    }

    // Validate all items before attempting addition
    for (const item of activeWishlistItems) {
      const product = item.productId;
      let variant = item.variantId;

      // Fallback to first active variant if no variant is specified
      if (product && !variant) {
        variant = await variantModel.findOne({
          productId: product._id,
          status: true,
        });
      }

      const isProductUnavailable =
        !product || product.isDeleted || product.isHidden;
      const isVariantUnavailable = variant
        ? variant.status === false || variant.isDeleted === true
        : false;
      const isUnavailable = isProductUnavailable || isVariantUnavailable;

      if (isUnavailable) {
        return {
          success: false,
          message:
            "Cannot add items. One or more products in your wishlist are unavailable.",
        };
      }

      const stock = variant ? variant.stock : 0;
      if (stock <= 0) {
        return {
          success: false,
          message:
            "Cannot add items. One or more products in your wishlist are out of stock.",
        };
      }
    }

    let addedCount = 0;
    let errors = [];

    for (const item of activeWishlistItems) {
      const product = item.productId;
      let variant = item.variantId;
      if (product && !variant) {
        variant = await variantModel.findOne({
          productId: product._id,
          status: true,
        });
      }
      const variantIdToUse = variant ? variant._id : null;

      const result = await addToCartService(
        userId,
        item.productId._id,
        variantIdToUse,
        1,
      );
      if (result.success) {
        item.isActive = false;
        addedCount++;
      } else {
        errors.push(result.message);
      }
    }

    if (addedCount > 0) {
      await wishlist.save();
      return {
        success: true,
        message: `${addedCount} item(s) added to cart successfully.`,
        errors: errors,
      };
    } else {
      return {
        success: false,
        message:
          errors.length > 0 ? errors[0] : "No items could be added to cart.",
      };
    }
  } catch (error) {
    console.error("addAllFromWishlistToCartService error:", error);
    throw error;
  }
};

export {
  addToCartService,
  getCartService,
  updateCartQuantityService,
  removeFromCartService,
  addAllFromWishlistToCartService,
};
