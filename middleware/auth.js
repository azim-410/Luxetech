import User from '../model/userModel.js';

const isAuthenticated = (req, res, next) => {
    if (req.session.user || req.user) {
        return next();
    }
    return res.redirect('/login');
};

const isLogin = (req, res, next) => {
    if (req.session.user || req.user) {
        return res.redirect('/');
    }
    return next();
};

const checkIfBlocked = async (req, res, next) => {
    try {
        if (!req.session.user) return next();

        const user = await User.findById(req.session.user.id).select('isBlocked').lean();

        if (!user) {
            return req.session.destroy(() => {
                res.clearCookie('connect.sid');
                return res.render('User/auth/login.ejs', { errorMessage: 'this user deleted by admin', errorField: 'general' });
            });
        }

        if (user.isBlocked) {
            return req.session.destroy(() => {
                res.clearCookie('connect.sid');
                return res.render('User/auth/login.ejs', { errorMessage: 'this user bloked by admin', errorField: 'general' });
            });
        }

        return next();
    } catch (err) {
        console.error('checkIfBlocked error:', err.message);
        return next();
    }
};


const blockIfGoogleUser = async (req,res,next)=>{
    if(!req.session.user){
        return res.redirect('/login');
    }
    const user = await User.findById(req.session.user.id)

    console.log("user in middlewareNew = "+user)
    console.log("authProvider is :"+user.authProvider);
    if(user.authProvider !== 'local'){
       return res.redirect('/profile'); 
    }

    return next();
}


export { isAuthenticated, isLogin, checkIfBlocked, blockIfGoogleUser };