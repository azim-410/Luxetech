import express from 'express';
const router = express.Router();


router.get('/', (req, res) => {
    res.render('User/landing');
});

router.get('/register',(req,res)=>{
    res.render('User/auth/register');
})

router.get('/login',(req,res)=>{
        res.render('User/auth/login')
})

router.get('/forget-password',(req,res)=>{
    res.render('User/auth/forget-password')
})

router.get('/otp',(req,res)=>{
    res.render('User/auth/otp-verification')
})

router.get('/reset',(req,res)=>{
    res.render('User/auth/reset-password')
})

router.get('/admin/login',(req,res)=>{
    res.render('Admin/auth/login');
})

export default router