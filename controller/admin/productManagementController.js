import {
    getProductAddService
}
from '../../services/admin/productManagementService.js'
const getProductList = async (req, res) => {
    try {
        res.render('Admin/productManagement');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching products');
    }
}

const getProductAdd = async (req,res)=>{
    try {
        const categories = await getProductAddService();
        console.log("from controller categoty =",categories)
        res.render('Admin/addProduct',{ categories });
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Error while page rendering');
    }
}

export {
    getProductList,
    getProductAdd
} 