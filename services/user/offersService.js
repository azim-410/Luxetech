import productModel from '../../model/product.js';
import variantModel from '../../model/variant.js';
import categoryModel from '../../model/category.js';

export const getOfferProductsService = async (queryObject) => {
    try {
        // Parse category filter from the query object (e.g. ?category=catId1,catId2)
        let selectedCategories = [];
        if (queryObject && queryObject.category) {
            selectedCategories = queryObject.category.split(',');
        }

        // Parse price filter from the query object (e.g. ?price=under-200,200-500)
        let selectedPrices = [];
        if (queryObject && queryObject.price) {
            selectedPrices = queryObject.price.split(',');
        }

        // Parse sorting option from the query object (e.g. ?sort=price-asc)
        let selectedSort = 'newest';
        if (queryObject && queryObject.sort) {
            selectedSort = queryObject.sort;
        }

        // 1. Get all active categories (to return to view for the sidebar)
        const categories = await categoryModel.find({
            isHidden: { $ne: true },
            status: true
        });

        // Identify which categories have active offers
        const categoriesWithOffers = categories.filter(cat => cat.categoryOfferPrice > 0);
        let targetCategoryIds = categoriesWithOffers.map(cat => cat._id.toString());

        // If category filters are selected, only keep those that also have offers
        if (selectedCategories.length > 0) {
            targetCategoryIds = targetCategoryIds.filter(id => selectedCategories.includes(id));
        }

        if (targetCategoryIds.length === 0) {
            return {
                products: [],
                categories: categories,
                selectedCategories: selectedCategories,
                selectedPrices: selectedPrices,
                selectedSort: selectedSort
            };
        }

        // Build Sorting Map
        const sortMap = {
            'newest': { createdAt: -1 },
            'price-asc': { basePrice: 1 },
            'price-desc': { basePrice: -1 }
        };
        const sortOption = sortMap[selectedSort] || {};

        // 2. Fetch all products belonging to these categories
        const products = await productModel.find({
            isDeleted: { $ne: true },
            isHidden: { $ne: true },
            status: { $ne: false },
            category: { $in: targetCategoryIds }
        }).populate('category').sort(sortOption);

        let productList = [];

        // 3. Process all products to get first variant image and display price
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

            productList.push({
                _id: product._id,
                name: product.name,
                description: product.description,
                basePrice: product.basePrice,
                discountedPrice: product.discountedPrice,
                displayPrice: displayPrice,
                category: product.category,
                firstImage: firstImage,
                createdAt: product.createdAt
            });
        }

        // 4. Filter by price ranges
        if (selectedPrices.length > 0) {
            let priceFilteredList = [];
            for (let i = 0; i < productList.length; i++) {
                const product = productList[i];
                const price = product.displayPrice;

                let matchesFilter = false;
                for (let j = 0; j < selectedPrices.length; j++) {
                    const range = selectedPrices[j];
                    if (range === 'under-200' && price < 200) {
                        matchesFilter = true;
                    }
                    if (range === '200-500' && price >= 200 && price <= 500) {
                        matchesFilter = true;
                    }
                    if (range === '500-1000' && price >= 500 && price <= 1000) {
                        matchesFilter = true;
                    }
                    if (range === 'over-1000' && price > 1000) {
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
            selectedSort: selectedSort
        };
    } catch (error) {
        console.error('getOfferProductsService error:', error);
        throw error;
    }
};
