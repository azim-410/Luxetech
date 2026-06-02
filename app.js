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
import adminRoutes from './routes/AdminRouter.js'
import connectDB from './config/db.js';
import nocache from 'nocache';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

// ✅ Session with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        ttl: 60 * 60 * 24 * 7
    }),
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

initPassport();
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user || req.session.user || null;
  next();
});

app.use(nocache());

app.use('/', authRoutes);
app.use('/', profileRoutes);
app.use('/admin/', adminRoutes);

app.listen(process.env.PORT, () => {
  console.log('\nserver running at http://localhost:' + process.env.PORT);
});