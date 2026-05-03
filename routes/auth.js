import express from 'express';
const router = express.Router();
import { register, login, logout } from '../controller/user/authController.js';
import { isAuthenticated, isLogin } from '../middleware/auth.js';

router.get('/', (req, res) => {
    res.render('User/landing');
});

router.get('/register',isLogin,(req,res)=>{
    res.render('User/auth/register');
})

router.get('/login',isLogin,(req,res)=>{
        res.render('User/auth/login')
})

router.get('/forget-password',isLogin,(req,res)=>{
    res.render('User/auth/forget-password')
})

router.get('/otp',isLogin,(req,res)=>{
    res.render('User/auth/otp-verification')
})

router.get('/reset',isLogin,(req,res)=>{
    res.render('User/auth/reset-password')
})

router.get('/admin/login',(req,res)=>{
    res.render('Admin/auth/login');
})

router.get('/favorite', isAuthenticated, (req, res) => res.render('User/favorite'));
router.get('/cart', isAuthenticated, (req, res) => res.render('User/cart'));
router.get('/profile', isAuthenticated, (req, res) => res.render('User/profile'));

router.post('/register',isLogin,register);

router.post('/login',isLogin,login)

router.post('/logout',isAuthenticated,logout);
export default router