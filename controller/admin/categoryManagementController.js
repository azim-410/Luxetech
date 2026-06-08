import {
    getCategoryService,
    createCategoryService,
    editCategoryServices,
    deleteCategoryService,
    deleteCategoryImageService,
    toggleCategoryVisibilityService
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
        const { categoryName, description, isHidden } = req.body;
        const image = req.file ? req.file.path : null;
        await createCategoryService(categoryName, description, true, image, isHidden);
        return res.redirect('/admin/category-management');
    } catch (error) {
        console.error('Create category error:', error.message);
        return res.redirect(`/admin/category-management?createError=${encodeURIComponent(error.message)}`);
    }
};

const editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryName, description, isHidden } = req.body;
        const image = req.file ? req.file.path : null;

        await editCategoryServices(id, categoryName, description, image, isHidden);
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

const deleteCategoryImage = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteCategoryImageService(id);
        return res.json({ success: true });
    } catch (error) {
        console.error('Delete category image error:', error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const toggleCategoryVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await toggleCategoryVisibilityService(id);
        return res.json(result);
    } catch (error) {
        console.error('Toggle visibility error:', error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export {
    getCategoryList,
    createCategory,
    editCategory,
    deleteCategory,
    deleteCategoryImage,
    toggleCategoryVisibility
} 