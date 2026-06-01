import {
    getAllUsersService,
    blockUserService,
    unblockUserService,
    deleteUserService,
    searchUsersService,
    createUserService    
} from '../../services/admin/userManagementService.js';

const getUserList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 5; 

        const {users, totalUsers, totalPages} = await getAllUsersService(page,limit);
        res.render('Admin/userManagement.ejs', { users, query: null, errorMessage: null, successMessage: null, totalPages, totalUsers, currentPage: page });
    } catch (error) {
        console.error('Get user list error:', error.message);
        res.status(500).send('Server error');
    }
};

const blockUser = async (req, res) => {
    try {
        await blockUserService(req.params.userId);
        res.redirect('/admin/user-management');
    } catch (error) {
        console.error('Block user error:', error.message);
        res.redirect('/admin/user-management');
    }
};

const unblockUser = async (req, res) => {
    try {
        await unblockUserService(req.params.userId);
        res.redirect('/admin/user-management');
    } catch (error) {
        console.error('Unblock user error:', error.message);
        res.redirect('/admin/user-management');
    }
};

const deleteUser = async (req, res) => {
    try {
        await deleteUserService(req.params.userId);
        res.redirect('/admin/user-management');
    } catch (error) {
        console.error('Delete user error:', error.message);
        res.redirect('/admin/user-management');
    }
};

const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const users = query
            ? await searchUsersService(query)
            : await getAllUsersService();
        res.render('Admin/userManagement.ejs', { users, query: query || null, errorMessage: null, successMessage: null });
    } catch (error) {
        console.error('Search users error:', error.message);
        res.status(500).send('Server error');
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        await createUserService(name, email, password);
        res.redirect('/admin/user-management');
    } catch (error) {
        console.error('Create user error:', error.message);
        res.redirect(`/admin/user-management?createError=${encodeURIComponent(error.message)}`);
    }
};

export {
    getUserList,
    blockUser,
    unblockUser,
    deleteUser,
    searchUsers,
    createUser
};