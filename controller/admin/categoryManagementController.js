import {
    getCategoryService,

} from '../../services/admin/categoryManagementService.js'
const getCategoryList = async (req, res) => {
    try {
        const categories = await getCategoryService();
        res.render('Admin/categoryManagement', { categories });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching categories');
    }
}

export {
    getCategoryList,
} 