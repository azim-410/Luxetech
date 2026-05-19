import express from 'express';
import session, { Cookie } from 'express-session'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js'
import connectDB from './config/db.js';
import nocache from 'nocache';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
connectDB();

app.use(express.json());   
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true ONLY if using HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}))


app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use(nocache());

app.use('/', authRoutes);

app.listen(process.env.PORT, () => {
    console.log('\nserver running at port http://localhost:' + process.env.PORT);
});


