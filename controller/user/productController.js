import { getProductsForListing, getProductDetailsService } from '../../services/user/productService.js';

const getShop = async (req, res) => {
    try {
        // Pass the raw query object directly to the service layer
        const serviceResult = await getProductsForListing(req.query);

        const products = serviceResult.products;
        const categories = serviceResult.categories;
        const selectedCategories = serviceResult.selectedCategories;
        const selectedPrices = serviceResult.selectedPrices;
        const selectedSort = serviceResult.selectedSort;

        res.render('User/product listing page', {
            products: products,
            categories: categories,
            selectedCategories: selectedCategories,
            selectedPrices: selectedPrices,
            selectedSort: selectedSort
        });
    } catch (error) {
        console.error('getShop error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getProductDetails = async (req, res) => {
    try {
        const productId = req.query.id;

        console.log("productId", productId);

        if (!productId) {
            return res.redirect('/shop');
        }

        const { product, variants } = await getProductDetailsService(productId);
        console.log("product", product);
        if (!product) {
            return res.redirect('/shop');
        }
        res.render('User/product details', { product, variants });
    } catch (error) {
        console.error('getProductDetails error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getCart = async (req, res) => {
    try {
        res.render('User/cart');
    } catch (error) {
        console.error('getCart error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getWishlist = async (req, res) => {
    try {
        res.render('User/favorite');
    } catch (error) {
        console.error('getWishlist error:', error);
        res.status(500).send('Internal Server Error');
    }
};


export {
    getShop,
    getProductDetails,
    getCart,
    getWishlist,

} 