import { adminLoginService } from '../../services/admin/adminAuthService.js';

const showLoginPage = (req, res) => {
    res.render('Admin/auth/login.ejs');
};
const showDashboard = async (req, res) => {
    res.render('Admin/dashboard.ejs')
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await adminLoginService(email, password);

        req.session.admin = { id: admin.id, email: admin.email };
        return res.redirect('/admin/dashboard');

    } catch (error) {
        console.error('Admin login error:', error.message);
        return res.status(400).render('Admin/auth/login.ejs', { errorMessage: error.message });
    }
};

const adminLogout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Admin logout error:', err)
            return res.status(500)
        }
        res.clearCookie('connect.sid');
        res.redirect('/admin/login');
    })
}

export {
    showLoginPage,
    adminLogin,
    adminLogout,
    showDashboard,
}