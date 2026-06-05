import {
    getCategoryService,
    createCategoryService,
    editCategoryServices,
    deleteCategoryService
} from '../../services/admin/categoryManagementService.js'
const getCategoryList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 5
        const search = req.query.search || '' 
        const createError = req.query.createError || null;
        const sort = req.query.sort || 'latest'

        const { categories, totalCategories, totalPage, totalActive } = await getCategoryService(page, limit, search,sort);
        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {   
            return res.json({ categories });                            
        }  

        res.render('Admin/categoryManagement', { categories, totalCategories, totalPage, totalActive, currentPage: page, createError,sort, search });

    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching categories');
    }
}

const createCategory = async (req, res) => {
    try {
        const { categoryName, description } = req.body;
        await createCategoryService(categoryName, description, true);
        return res.redirect('/admin/category-management');
    } catch (error) {
        console.error('Create category error:', error.message);
        return res.redirect(`/admin/category-management?createError=${encodeURIComponent(error.message)}`);
    }
};

const editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryName, description } = req.body;

        await editCategoryServices(id, categoryName, description);
        return res.json({ success: true });
    } catch (error) {
        console.error('Edit category error:', error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteCategoryService(id);
        return res.json({ success: true });
    } catch (error) {
        console.error('Delete category error:', error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
}
export {
    getCategoryList,
    createCategory,
    editCategory,
    deleteCategory
} 