import {
    getCategoryService,
    createCategoryService
} from '../../services/admin/categoryManagementService.js'
const getCategoryList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 5
        const createError = req.query.createError || null;

        const { categories, totalCategories, totalPage } = await getCategoryService(page, limit);

        res.render('Admin/categoryManagement', { categories, totalCategories, totalPage, currentPage: page, createError });

    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching categories');
    }
}

const createCategory = async (req, res) => {
    try {
        const { categoryName, description, status } = req.body;
        await createCategoryService(categoryName, description, status);
        return res.redirect('/admin/category-management');
    } catch (error) {
        console.error('Create category error:', error.message);
        return res.redirect(`/admin/category-management?createError=${encodeURIComponent(error.message)}`);
    }
};

export {
    getCategoryList,
    createCategory
} 