import { 
    getProductsForListing, 
    getProductDetailsService,
    addToWishlistService,
    getWishlistService,
    removeFromWishlistService,
    getProductDetailsPageDataService
} from '../../services/user/productService.js';
import {
    addToCartService,
    getCartService,
    updateCartQuantityService,
    removeFromCartService,
    addAllFromWishlistToCartService
} from '../../services/user/cartService.js';

const getShop = async (req, res) => {
    try {
        // Pass the raw query object directly to the service layer
        const serviceResult = await getProductsForListing(req.query);

        const products = serviceResult.products;
        const categories = serviceResult.categories;
        const selectedCategories = serviceResult.selectedCategories;
        const selectedPrices = serviceResult.selectedPrices;
        const selectedSort = serviceResult.selectedSort;
        const selectedSearch = serviceResult.selectedSearch || '';

        res.render('User/product listing page', {
            products: products,
            categories: categories,
            selectedCategories: selectedCategories,
            selectedPrices: selectedPrices,
            selectedSort: selectedSort,
            selectedSearch: selectedSearch
        });
    } catch (error) {
        console.error('getShop error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getProductDetails = async (req, res) => {
    try {
        const productId = req.query.id || req.query.productId;
        if (!productId) {
            return res.redirect('/shop');
        }

        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        const queryVariantId = req.query.variantId || null;

        const data = await getProductDetailsPageDataService(productId, userId, queryVariantId);
        if (!data) {
            return res.redirect('/shop');
        }

        res.render('User/product details', data);
    } catch (error) {
        console.error('getProductDetails error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.redirect('/login');
        }

        const cartData = await getCartService(userId);

        res.render('User/cart', {
            cart: cartData,
            user: req.session.user || req.user || null,
            cartError: null
        });
    } catch (error) {
        console.error('getCart error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        const { productId, variantId, quantity } = req.body;
        if (!productId) {
            return res.redirect('/shop');
        }

        const result = await addToCartService(userId, productId, variantId || null, quantity ? parseInt(quantity) : 1);
        
        if (!result.success) {
            return res.redirect(`/product-details?id=${productId}&error=${encodeURIComponent(result.message)}`);
        }

        return res.redirect(`/product-details?id=${productId}&success=${encodeURIComponent(result.message || 'Product added to cart successfully.')}`);
    } catch (error) {
        console.error('addToCart controller error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const updateCartQuantity = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const { productId, variantId, quantity } = req.body;
        console.log('--- updateCartQuantity controller called ---');
        console.log('req.body:', req.body);
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' });
        }

        const result = await updateCartQuantityService(userId, productId, variantId || null, quantity);
        
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        const updatedCart = await getCartService(userId);
        return res.json({ 
            success: true, 
            message: result.message,
            cart: updatedCart
        });
    } catch (error) {
        console.error('updateCartQuantity controller error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const { productId, variantId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' });
        }

        const result = await removeFromCartService(userId, productId, variantId || null);
        
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        const updatedCart = await getCartService(userId);
        return res.json({ 
            success: true, 
            message: result.message,
            cart: updatedCart
        });
    } catch (error) {
        console.error('removeFromCart controller error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.redirect('/login');
        }

        const wishlistItems = await getWishlistService(userId);

        res.render('User/favorite', {
            wishlistItems: wishlistItems,
            user: req.session.user || req.user || null
        });
    } catch (error) {
        console.error('getWishlist error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        const productId = req.body.productId;
        const variantId = req.body.variantId || null;
        if (!productId) {
            return res.redirect('/shop');
        }

        const result = await addToWishlistService(userId, productId, variantId);
        if (!result.success) {
            return res.redirect(`/product-details?id=${productId}&error=${encodeURIComponent(result.message)}`);
        }
        return res.redirect(`/product-details?id=${productId}&success=${encodeURIComponent('Added to wishlist.')}`);
    } catch (error) {
        console.error('addToWishlist error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized.' });
        }

        const productId = req.body.productId || req.query.productId;
        const variantId = req.body.variantId || req.query.variantId || null;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' });
        }

        await removeFromWishlistService(userId, productId, variantId);
        return res.json({ success: true, message: 'Removed from favorites.' });
    } catch (error) {
        console.error('removeFromWishlist error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const addAllFromWishlistToCart = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Please login to perform this action.' });
        }

        const result = await addAllFromWishlistToCartService(userId);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        return res.json({ success: true, message: result.message });
    } catch (error) {
        console.error('addAllFromWishlistToCart controller error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getSupport = async (req, res) => {
    try {
        res.render('User/support', {
            user: req.session.user || req.user || null
        });
    } catch (error) {
        console.error('getSupport error:', error);
        res.status(500).send('Internal Server Error');
    }
};

export {
    getShop,
    getProductDetails,
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    addAllFromWishlistToCart,
    getSupport
}; 