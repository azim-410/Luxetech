import { connect } from "http2";
import { registerUser,loginUser } from "../../services/user/authService.js"


const register = async (req, res) => {
     console.log(req.body);
    try {
        await registerUser(req.body);
        res.redirect('/');          
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
    try {
        const result = await loginUser(req.body)
        if(!result.user){
            const err = new Error("Login failed");
            err.field = 'general';
            throw err;

        }
        req.session.user={
            id:result.user._id,
            email:result.user.email
        }
        res.redirect('/');
    } catch (error) {
        console.log("controller erorr:",error.message);
        res.status(400).render('User/auth/login',{
            errorMessage: error.message,
            errorField: error.field,
            formData: req.body
        })
    }
}

const logout = (req,res)=>{
    req.session.destroy;
    res.clearCookie('connect.sid');
    res.redirect('/');
}
export { register,login,logout };
