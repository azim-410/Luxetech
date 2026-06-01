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
    next();
};

const checkIfBlocked = async (req, res, next) => {
    try {
        if (!req.session.user) return next();

        const user = await User.findById(req.session.user.id).select('isBlocked').lean();

        if (!user || user.isBlocked) {
            req.session.destroy(() => {
                res.clearCookie('connect.sid');
                res.render('User/auth/login.ejs',{errorMessage:'this user bloked by admin',errorField:'general'});
                
            });
            return;
        }

        next();
    } catch (err) {
        console.error('checkIfBlocked error:', err.message);
        next();
    }
};

export { isAuthenticated, isLogin, checkIfBlocked };