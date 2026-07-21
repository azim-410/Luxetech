import "./config/env.js";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import MongoStore from "connect-mongo";
import passport from "passport";
import { initPassport } from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import productRoutes from "./routes/productRouter.js";
import adminRoutes from "./routes/AdminRouter.js";
import connectDB from "./config/db.js";
import nocache from "nocache";
import methodOverride from "method-override";
import { fetchHeaderCounts } from "./middleware/globalMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// User session (cookie: connect.sid)
const userSession = session({
  name: "connect.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: "user_sessions",
    ttl: 60 * 60 * 24 * 7,
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
});

// Admin session (cookie: admin.sid) — completely separate from user session
const adminSession = session({
  name: "admin.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: "admin_sessions",
    ttl: 60 * 60 * 24,
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
});

// Apply user session ONLY to non-admin routes
app.use((req, res, next) => {
  if (req.path.startsWith("/admin")) return next();
  userSession(req, res, next);
});

// Passport also only for non-admin routes
initPassport();
app.use((req, res, next) => {
  if (req.path.startsWith("/admin")) return next();
  passport.initialize()(req, res, next);
});
app.use((req, res, next) => {
  if (req.path.startsWith("/admin")) return next();
  passport.session()(req, res, next);
});

app.use(fetchHeaderCounts);

app.use(nocache());

app.use(methodOverride("_method"));

app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", productRoutes);

// Admin routes get ONLY the admin session — user session never touches these
app.use("/admin/", adminSession, adminRoutes);

app.listen(process.env.PORT, () => {
  console.log("\nserver running at http://localhost:" + process.env.PORT);
});
