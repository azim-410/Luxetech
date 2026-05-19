# LuxeTech - E-Commerce Platform

A modern e-commerce web application built with Node.js, Express, and MongoDB, specializing in premium tech products like keyboards, monitors, mice, and headsets.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Routes](#api-routes)
- [Authentication Flow](#authentication-flow)
- [Database Models](#database-models)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

LuxeTech is a full-stack e-commerce platform designed for selling premium tech peripherals. The application features a robust authentication system with OTP verification, password recovery, user profiles, shopping cart, and favorites functionality.

## ✨ Features

### User Authentication
- **User Registration** with email verification via OTP
- **Secure Login** with bcrypt password hashing
- **OTP Verification** for account activation (5-minute expiry)
- **Resend OTP** functionality
- **Forgot Password** with OTP-based reset
- **Session Management** with express-session
- **Auto-cleanup** of unverified users after 12 minutes

### User Features
- User profile management
- Shopping cart functionality
- Favorites/Wishlist
- Secure session-based authentication
- Protected routes with middleware

### Admin Features
- Admin dashboard
- Separate admin login interface

### Security Features
- Password hashing with bcrypt (10 salt rounds)
- Session-based authentication
- HTTP-only cookies
- No-cache middleware to prevent sensitive data caching
- OTP expiration and auto-deletion
- Protected routes with authentication middleware

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** (v5.2.1) - Web framework
- **MongoDB** - Database
- **Mongoose** (v9.6.0) - ODM for MongoDB

### Authentication & Security
- **bcrypt** (v6.0.0) - Password hashing
- **express-session** (v1.19.0) - Session management
- **nocache** (v4.0.0) - Prevent caching

### Email & Communication
- **Nodemailer** (v8.0.7) - Email service for OTP delivery

### View Engine
- **EJS** (v5.0.2) - Templating engine

### Development Tools
- **Nodemon** (v3.1.14) - Auto-restart during development
- **dotenv** (v17.4.2) - Environment variable management

## 📁 Project Structure

```
mm/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── controller/
│   └── user/
│       └── authController.js # Authentication controllers
├── middleware/
│   └── auth.js              # Authentication middleware
├── model/
│   ├── otp.js               # OTP schema
│   └── userModel.js         # User schema
├── public/
│   ├── admin/
│   │   └── css/             # Admin styles
│   └── User/
│       ├── css/             # User styles
│       ├── images/          # Product images
│       └── js/              # Client-side scripts
├── routes/
│   └── auth.js              # Authentication routes
├── services/
│   └── user/
│       └── authService.js   # Business logic for authentication
├── utils/
│   ├── genarateOTP.js       # OTP generation utility
│   └── sendEmail.js         # Email sending utility
├── views/
│   ├── Admin/
│   │   ├── dashboard.ejs
│   │   └── auth/
│   │       └── login.ejs
│   ├── User/
│   │   ├── landing.ejs
│   │   ├── cart.ejs
│   │   ├── favorite.ejs
│   │   ├── profile.ejs
│   │   └── auth/
│   │       ├── login.ejs
│   │       ├── register.ejs
│   │       ├── otp-verification.ejs
│   │       ├── forget-password.ejs
│   │       └── reset-password.ejs
│   └── partials/
│       └── user/
│           ├── auth-header.ejs
│           ├── auth-footer.ejs
│           └── main-header.ejs
├── .gitignore
├── app.js                   # Main application file
├── package.json
└── README.md
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/azim-410/Luxetech.git
   cd mm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URL=mongodb://localhost:27017/luxetech
   
   # Email Configuration (for OTP)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | Yes |
| `MONGO_URL` | MongoDB connection string | Yes |
| `EMAIL_USER` | Email address for sending OTPs | Yes |
| `EMAIL_PASS` | Email password/app password | Yes |

### Session Configuration

Sessions are configured with:
- **Secret**: 'key' (⚠️ Change in production!)
- **Cookie Max Age**: 1 hour (3600000ms)
- **HTTP Only**: true
- **Secure**: false (set to true in production with HTTPS)

## 📖 Usage

### For Users

1. **Register**: Create an account with name, email, and password
2. **Verify OTP**: Check your email for the 6-digit OTP (valid for 5 minutes)
3. **Login**: Access your account with email and password
4. **Browse Products**: View keyboards, monitors, mice, and headsets
5. **Add to Cart**: Select products to purchase
6. **Add to Favorites**: Save products for later
7. **Manage Profile**: Update your account information

### For Developers

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## 🛣️ API Routes

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Landing page |
| GET | `/register` | Registration page |
| GET | `/login` | Login page |
| GET | `/forget-password` | Forgot password page |
| GET | `/otp` | OTP verification page |
| GET | `/reset` | Reset password page |

### Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| POST | `/logout` | User logout |
| POST | `/verify-otp` | Verify registration OTP |
| POST | `/resend-otp` | Resend OTP |
| POST | `/forget-password` | Request password reset |
| POST | `/verify-reset-otp` | Verify password reset OTP |
| POST | `/reset-password` | Update password |

### Protected Routes (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | User profile page |
| GET | `/cart` | Shopping cart |
| GET | `/favorite` | Favorites/Wishlist |

## 🔐 Authentication Flow

### Registration Flow
1. User submits registration form (name, email, password, terms)
2. System validates input and checks for existing email
3. Password is hashed using bcrypt (10 rounds)
4. User document is created with `isVerified: false`
5. 6-digit OTP is generated and stored with 5-minute expiry
6. OTP is sent to user's email via Nodemailer
7. User session is created with `userId`
8. User is redirected to OTP verification page

### OTP Verification Flow
1. User enters 6-digit OTP
2. System validates OTP against database record
3. Checks OTP expiry (5 minutes)
4. If valid, user's `isVerified` is set to `true`
5. User's `userExpire` field is cleared (prevents auto-deletion)
6. OTP record is deleted
7. User is redirected to login page

### Login Flow
1. User submits email and password
2. System finds user by email
3. Password is compared using bcrypt
4. If valid, user session is created with user ID and email
5. User is redirected to landing page

### Password Reset Flow
1. User requests password reset with email
2. System generates and sends OTP to email
3. User verifies OTP
4. Session flag `canResetPassword` is set
5. User enters new password
6. Password is hashed and updated
7. Session flags are cleared
8. User is redirected to login

## 🗄️ Database Models

### User Model

```javascript
{
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed),
  myReferralCode: String (unique, sparse),
  referredBy: String (default: null),
  role: String (default: "user"),
  terms: Boolean (required),
  userExpire: Date (expires after 720 seconds if not verified),
  isVerified: Boolean (default: false),
  timestamps: true
}
```

### OTP Model

```javascript
{
  userId: ObjectId (ref: User, required),
  otp: String (required),
  expiresAt: Date (required, TTL index for auto-deletion),
  attempts: Number (default: 0),
  timestamps: true
}
```

## 🔒 Security Best Practices

1. **Password Security**
   - Passwords are hashed with bcrypt (10 salt rounds)
   - Minimum password length: 6 characters
   - Password confirmation required during registration

2. **Session Security**
   - HTTP-only cookies prevent XSS attacks
   - Session expires after 1 hour of inactivity
   - Secure flag should be enabled in production (HTTPS)

3. **OTP Security**
   - OTPs expire after 5 minutes
   - Auto-deletion via MongoDB TTL indexes
   - One-time use (deleted after verification)

4. **Input Validation**
   - Email format validation
   - Name validation (letters only)
   - Terms and conditions acceptance required

5. **Route Protection**
   - Middleware checks authentication status
   - Redirects unauthenticated users to login
   - Prevents authenticated users from accessing auth pages

## 🚧 Future Enhancements

- [ ] Product catalog with categories
- [ ] Shopping cart checkout process
- [ ] Payment gateway integration
- [ ] Order management system
- [ ] Admin product management
- [ ] User reviews and ratings
- [ ] Search and filter functionality
- [ ] Wishlist sharing
- [ ] Email notifications for orders
- [ ] Multi-factor authentication
- [ ] Social media login integration
- [ ] Referral system implementation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Azim**
- GitHub: [@azim-410](https://github.com/azim-410)
- Repository: [Luxetech](https://github.com/azim-410/Luxetech.git)

## 📞 Support

For support, email your-email@example.com or open an issue in the GitHub repository.

---

**Note**: This project is currently in development. Some features may be incomplete or subject to change.
