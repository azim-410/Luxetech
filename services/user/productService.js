import productModel from '../../model/product.js';
import variantModel from '../../model/variant.js';
import categoryModel from '../../model/category.js';

const getProductsForListing = async (queryObject) => {
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
        let selectedSort = 'featured';
        if (queryObject && queryObject.sort) {
            selectedSort = queryObject.sort;
        }

        // Fetch categories to return to view
        const categories = await categoryModel.find({ isHidden: false, status: true });

        // Build Sorting Map exactly like in categoryManagementService and productManagementService
        const sortMap = {
            'featured': { createdAt: -1 },
            'newest': { createdAt: -1 },
            'price-asc': { basePrice: 1 },
            'price-desc': { basePrice: -1 }
        };
        const sortOption = sortMap[selectedSort] || sortMap['featured'];

        // Build database query
        const query = { isDeleted: false, isHidden: false };
        if (selectedCategories.length > 0) {
            query.category = { $in: selectedCategories };
        }

        // Fetch all active products sorted directly in MongoDB query
        const products = await productModel
            .find(query)
            .populate('category')
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

        // 3. Filter by price ranges (using simple for loop)
        let priceFilteredList = [];
        if (selectedPrices.length > 0) {
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
        console.error('getProductsForListing service error:', error);
        throw error;
    }
};

const getProductDetailsService = async (productId) => {
    try {
        const product = await productModel.findById(productId).populate('category');
        const variants = await variantModel.find({ productId: productId, status: true });

        return {
            product: product,
            variants: variants
        };
    } catch (error) {
        console.error('getProductDetailsService error:', error);
        throw error;
    }
};

export {
    getProductsForListing,
    getProductDetailsService
};
