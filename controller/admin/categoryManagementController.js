import {
    getCategoryService,
    createCategoryService,
    editCategoryServices
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

const editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryName, description, status } = req.body;

        await editCategoryServices(id, categoryName, description, status);
        return res.json({ success: true });
    } catch (error) {
        console.error('Edit category error:', error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export {
    getCategoryList,
    createCategory,
    editCategory
} 