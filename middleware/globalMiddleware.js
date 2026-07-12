import Cart from '../model/cart.js';
import Wishlist from '../model/wishlist.js';

/**
 * Global Middleware: Runs on every user request (non-admin).
 * - Shares the logged-in user's data with all EJS templates (res.locals.user).
 * - Queries the database to fetch active Cart and Wishlist item counts for the header badge.
 */
const fetchHeaderCounts = async (req, res, next) => {
    // 1. Resolve the logged-in user from either Passport (req.user) or session (req.session.user)
    let user = null;
    if (req.user) {
        user = req.user;
    } else if (req.session && req.session.user) {
        user = req.session.user;
    }

    // 2. Make user object globally available in EJS templates
    res.locals.user = user;

    // 3. Initialize default counts (0 for guest users)
    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;

    // 4. Resolve unique user ID
    let userId = null;
    if (req.user && req.user._id) {
        userId = req.user._id;
    } else if (req.session && req.session.user && req.session.user.id) {
        userId = req.session.user.id;
    }

    // 5. If user is authenticated, query counts from Cart & Wishlist collections
    if (userId) {
        try {
            // Fetch cart and count total unique items
            const userCart = await Cart.findOne({ userId: userId });
            if (userCart && userCart.items) {
                res.locals.cartCount = userCart.items.length;
            }

            // Fetch wishlist and count active products
            const userWishlist = await Wishlist.findOne({ userId: userId });
            if (userWishlist && userWishlist.products) {
                res.locals.wishlistCount = userWishlist.products.filter(p => p.isActive !== false).length;
            }
        } catch (error) {
            console.error("Error fetching header counts in global middleware:", error);
        }
    }

    // 6. Proceed to the next middleware / route handler
    next();
};

export { fetchHeaderCounts };
