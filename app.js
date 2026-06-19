import './config/env.js'
import express from 'express';
import session from 'express-session'          
import path from 'path'
import { fileURLToPath } from 'url';
import MongoStore from 'connect-mongo';         
import passport from 'passport';               
import { initPassport } from './config/passport.js';
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import productRoutes from './routes/productRouter.js'
import adminRoutes from './routes/AdminRouter.js'
import connectDB from './config/db.js';
import nocache from 'nocache';
import methodOverride from 'method-override';
import Cart from './model/cart.js';
import Wishlist from './model/wishlist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

// User session (cookie: connect.sid)
const userSession = session({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: 'user_sessions',
        ttl: 60 * 60 * 24 * 7
    }),
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
});

// Admin session (cookie: admin.sid) — completely separate from user session
const adminSession = session({
    name: 'admin.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: 'admin_sessions',
        ttl: 60 * 60 * 24
    }),
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
});

// Apply user session ONLY to non-admin routes
app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) return next();
    userSession(req, res, next);
});

// Passport also only for non-admin routes
initPassport();
app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) return next();
    passport.initialize()(req, res, next);
});
app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) return next();
    passport.session()(req, res, next);
});

// Global Middleware: This function runs on every single web page request.
// It fetches the number of items in the user's Cart and Wishlist to show them in the top header bar.
app.use(async (req, res, next) => {
    // 1. Get the logged-in user's information from the session or passport authentication
    let user = null;
    if (req.user) {
        user = req.user;
    } else if (req.session && req.session.user) {
        user = req.session.user;
    }

    // 2. Share the user data with all EJS templates globally so we don't have to pass it manually in every controller
    res.locals.user = user;

    // 3. Set the default counts to 0. If the user is a guest (not logged in), they will see 0.
    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;

    // 4. Get the logged-in user's ID
    let userId = null;
    if (req.user && req.user._id) {
        userId = req.user._id;
    } else if (req.session && req.session.user && req.session.user.id) {
        userId = req.session.user.id;
    }

    // 5. If the user is logged in, fetch their cart and wishlist count from the database
    if (userId) {
        try {
            // Fetch the user's Cart from MongoDB
            const userCart = await Cart.findOne({ userId: userId });
            if (userCart && userCart.items) {
                // Count how many unique products are in the cart array
                res.locals.cartCount = userCart.items.length;
            }

            // Fetch the user's Wishlist from MongoDB
            const userWishlist = await Wishlist.findOne({ userId: userId });
            if (userWishlist && userWishlist.products) {
                // Count how many active unique products are in the wishlist products array
                res.locals.wishlistCount = userWishlist.products.filter(p => p.isActive !== false).length;
            }
        } catch (error) {
            // Print an error in the terminal if something goes wrong with the database query
            console.error("Error fetching header counts:", error);
        }
    }

    // 6. Move to the next middleware or route handler
    next();
});

app.use(nocache());

app.use(methodOverride('_method'));

app.use('/', authRoutes);
app.use('/', profileRoutes);
app.use('/', productRoutes);

// Admin routes get ONLY the admin session — user session never touches these
app.use('/admin/', adminSession, adminRoutes);

app.listen(process.env.PORT, () => {
  console.log('\nserver running at http://localhost:' + process.env.PORT);
});