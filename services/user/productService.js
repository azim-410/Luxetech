import productModel from "../../model/product.js";
import variantModel from "../../model/variant.js";
import categoryModel from "../../model/category.js";
import wishlistModel from "../../model/wishlist.js";

const getProductsForListing = async (queryObject) => {
  try {
    // Parse category filter from the query object (e.g. ?category=catId1,catId2)
    let selectedCategories = [];
    if (queryObject && queryObject.category) {
      selectedCategories = queryObject.category.split(",");
    }

    // Parse price filter from the query object (e.g. ?price=under-200,200-500)
    let selectedPrices = [];
    if (queryObject && queryObject.price) {
      selectedPrices = queryObject.price.split(",");
    }

    // Parse sorting option from the query object (e.g. ?sort=price-asc)
    let selectedSort = "newest";
    if (queryObject && queryObject.sort) {
      selectedSort = queryObject.sort;
    }

    // Parse search query
    let search = "";
    if (queryObject && queryObject.search) {
      search = queryObject.search.trim();
    }

    // Fetch categories to return to view
    const categories = await categoryModel.find({
      isHidden: { $ne: true },
      status: true,
    });

    // Build Sorting Map exactly like in categoryManagementService and productManagementService
    const sortMap = {
      newest: { createdAt: -1 },
      "price-asc": { basePrice: 1 },
      "price-desc": { basePrice: -1 },
    };
    const sortOption = sortMap[selectedSort] || {};

    // Build database query
    const query = { isDeleted: { $ne: true } };
    if (selectedCategories.length > 0) {
      query.category = { $in: selectedCategories };
    }
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Fetch all active products sorted directly in MongoDB query
    const products = await productModel
      .find(query)
      .populate("category")
      .sort(sortOption);

    let productList = [];

    // 1. Process all products to add images and display prices
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      // Find one variant to get the first image
      const variant = await variantModel.findOne({ productId: product._id });

      let firstImage = null;
      if (variant && variant.images && variant.images.length > 0) {
        firstImage = variant.images[0];
      }

      // Calculate display price (use discount if available, otherwise base price)
      let displayPrice = product.basePrice;
      if (product.discountedPrice && product.discountedPrice > 0) {
        displayPrice = product.discountedPrice;
      }

      const isBlocked =
        product.isHidden === true ||
        product.status === false ||
        !product.category ||
        product.category.isHidden === true ||
        product.category.status === false;

      productList.push({
        _id: product._id,
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        discountedPrice: product.discountedPrice,
        displayPrice: displayPrice,
        category: product.category,
        firstImage: firstImage,
        createdAt: product.createdAt,
        isBlocked: isBlocked,
      });
    }

    // 3. Filter by price ranges (using simple for loop)
    let priceFilteredList = [];
    if (selectedPrices.length > 0) {
      for (let i = 0; i < productList.length; i++) {
        const product = productList[i];
        const price = product.displayPrice;

        let matchesFilter = false;
        for (let j = 0; j < selectedPrices.length; j++) {
          const range = selectedPrices[j];
          if (range === "under-200" && price < 200) {
            matchesFilter = true;
          }
          if (range === "200-500" && price >= 200 && price <= 500) {
            matchesFilter = true;
          }
          if (range === "500-1000" && price >= 500 && price <= 1000) {
            matchesFilter = true;
          }
          if (range === "over-1000" && price > 1000) {
            matchesFilter = true;
          }
        }

        if (matchesFilter) {
          priceFilteredList.push(product);
        }
      }
      productList = priceFilteredList;
    }

    return {
      products: productList,
      categories: categories,
      selectedCategories: selectedCategories,
      selectedPrices: selectedPrices,
      selectedSort: selectedSort,
      selectedSearch: search,
    };
  } catch (error) {
    console.error("getProductsForListing service error:", error);
    throw error;
  }
};

const getProductDetailsService = async (productId) => {
  try {
    const product = await productModel.findById(productId).populate("category");
    const variants = await variantModel.find({
      productId: productId,
      status: true,
    });

    return {
      product: product,
      variants: variants,
    };
  } catch (error) {
    console.error("getProductDetailsService error:", error);
    throw error;
  }
};

const addToWishlistService = async (userId, productId, variantId) => {
    try {
        if (!userId) {
            return { success: false, message: 'Please login to add favorites.' };
        }
        // Validate product is still active before adding to wishlist
        const product = await productModel.findById(productId);
        if (!product || product.isDeleted) {
            return { success: false, message: 'This product is no longer available.' };
        }
        if (product.isHidden) {
            return { success: false, message: 'This product is currently unavailable.' };
        }

        let wishlist = await wishlistModel.findOne({ userId: userId });

        if (!wishlist) {
            wishlist = new wishlistModel({
                userId: userId,
                products: []
            });
        }

        let existingIndex = -1;
        for (let i = 0; i < wishlist.products.length; i++) {
            const item = wishlist.products[i];
            const sameProd = item.productId.toString() === productId.toString();
            const sameVar = (!item.variantId && !variantId) || 
                            (item.variantId && variantId && item.variantId.toString() === variantId.toString());
            
            if (sameProd && sameVar) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex !== -1) {
            // If the item is already active in the wishlist, return a validation warning
            if (wishlist.products[existingIndex].isActive === true) {
                return { success: false, message: 'This variant is already in your wishlist.' };
            }
            // Re-activate if it was soft-deleted
            wishlist.products[existingIndex].isActive = true;
        } else {
            // Add new product with specific variant
            wishlist.products.push({
                productId: productId,
                variantId: variantId || null,
                isActive: true
            });
        }

        await wishlist.save();
        return { success: true };
    } catch (error) {
        console.error('addToWishlistService error:', error);
        throw error;
    }
};

const getWishlistService = async (userId) => {
  try {
    const wishlist = await wishlistModel
      .findOne({ userId: userId })
      .populate("products.productId")
      .populate("products.variantId");

    let wishlistItems = [];

    if (wishlist && wishlist.products) {
      for (let i = 0; i < wishlist.products.length; i++) {
        const item = wishlist.products[i];

        // Only show active items
        if (item.isActive === false) {
          continue;
        }

        const product = item.productId;
        let variant = item.variantId;

        // Fallback to first active variant if no variant is specified for the wishlist item
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

        // Get variant image if present, else default to any first variant image
        let firstImage = null;
        if (variant && variant.images && variant.images.length > 0) {
          firstImage = variant.images[0];
        } else if (product) {
          const fallbackVariant = await variantModel.findOne({
            productId: product._id,
          });
          if (
            fallbackVariant &&
            fallbackVariant.images &&
            fallbackVariant.images.length > 0
          ) {
            firstImage = fallbackVariant.images[0];
          }
        }

        // Display price calculation: base price + variant price addition
        let displayPrice = product ? product.basePrice : 0;
        if (product && product.discountedPrice && product.discountedPrice > 0) {
          displayPrice = product.discountedPrice;
        }
        if (variant && variant.priceAdd) {
          displayPrice += variant.priceAdd;
        }

        // Display name including variant info
        let displayName = product ? product.name : "Unknown Product";
        if (variant) {
          displayName += ` - ${variant.option}`;
        }

        const stockVal = variant ? variant.stock : 0;
        const isStockout = !isUnavailable && stockVal <= 0;
        const isLowStock = !isUnavailable && stockVal > 0 && stockVal <= 5;
        const inStock = !isUnavailable && stockVal > 5;
        const isAddableToCart = !isUnavailable && stockVal > 0;

        wishlistItems.push({
          productId: product ? product._id : item.productId,
          variantId: variant ? variant._id : item.variantId,
          name: displayName,
          description: product
            ? product.description
            : "Product details are no longer available.",
          basePrice: product ? product.basePrice : 0,
          discountedPrice: product ? product.discountedPrice : 0,
          displayPrice: displayPrice,
          firstImage: firstImage,
          stock: stockVal,
          isUnavailable: isUnavailable,
          isStockout: isStockout,
          isLowStock: isLowStock,
          inStock: inStock,
          isAddableToCart: isAddableToCart,
        });
      }
    }

    return wishlistItems;
  } catch (error) {
    console.error("getWishlistService error:", error);
    throw error;
  }
};

const removeFromWishlistService = async (userId, productId, variantId) => {
  try {
    const wishlist = await wishlistModel.findOne({ userId: userId });
    if (wishlist) {
      for (let i = 0; i < wishlist.products.length; i++) {
        const item = wishlist.products[i];
        const sameProd = item.productId.toString() === productId.toString();
        const sameVar =
          (!item.variantId && !variantId) ||
          (item.variantId &&
            variantId &&
            item.variantId.toString() === variantId.toString());

        if (sameProd && sameVar) {
          wishlist.products[i].isActive = false;
          break;
        }
      }
      await wishlist.save();
    }
    return { success: true };
  } catch (error) {
    console.error("removeFromWishlistService error:", error);
    throw error;
  }
};

const getProductDetailsPageDataService = async (
  productId,
  userId,
  queryVariantId,
) => {
  try {
    const product = await productModel.findById(productId).populate("category");
    if (!product || product.isDeleted) {
      return null;
    }

    const variants = await variantModel.find({
      productId: productId,
      status: true,
    });
    const isBlocked = product.isHidden === true;

    let wishlistItems = [];
    if (userId) {
      try {
        wishlistItems = await getWishlistService(userId);
      } catch (err) {
        console.error(
          "Error fetching wishlist in product details service:",
          err,
        );
      }
    }

    const selectedVariantId = queryVariantId || null;

    // Pre-calculate variables to clean up EJS template logic
    let initialImages = [];
    if (
      variants &&
      variants.length > 0 &&
      variants[0].images &&
      variants[0].images.length > 0
    ) {
      initialImages = variants[0].images;
    } else if (product.images && product.images.length > 0) {
      initialImages = product.images;
    }

    const firstVariantPriceAdd = variants.length > 0 ? variants[0].priceAdd : 0;
    const initialPrice =
      (product.discountedPrice && product.discountedPrice > 0
        ? product.discountedPrice
        : product.basePrice) + firstVariantPriceAdd;
    const initialBasePrice = product.basePrice + firstVariantPriceAdd;
    const hasDiscount = !!(
      product.discountedPrice && product.discountedPrice > 0
    );

    return {
      product,
      variants,
      selectedVariantId,
      isBlocked,
      wishlistItems,
      initialImages,
      initialPrice,
      initialBasePrice,
      hasDiscount,
    };
  } catch (error) {
    console.error("getProductDetailsPageDataService error:", error);
    throw error;
  }
};

export {
  getProductsForListing,
  getProductDetailsService,
  addToWishlistService,
  getWishlistService,
  removeFromWishlistService,
  getProductDetailsPageDataService,
};
