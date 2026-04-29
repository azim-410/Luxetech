import { registerUser,loginUser } from "../../services/user/authService.js"


const register = async (req, res) => {
     console.log(req.body);
    try {
        await registerUser(req.body);
        res.redirect('/otp');          
    } catch (error) {
        console.log("controller erorr:",error.message);
        res.status(400).render('User/auth/register', {
            errorMessage: error.message,
            errorField: error.field || 'general',
            formData: req.body
        });
    }
}

const login = async (req,res)=>{
    console.log(req.body);
    try {
        await loginUser(req.body);
        res.redirect('/');
    } catch (error) {
        console.log("controller erorr:",error.message);
        res.status(400).render('User/auth/login',{
            errorMessage: error.message,
            errorField: error.field || 'general',
            formData: req.body
        })
    }
}

export { register,login };
