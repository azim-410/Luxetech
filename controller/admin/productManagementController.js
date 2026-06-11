import {
    getProductAddService,
    addProductService,
    getProductListService,
    getProductEditDataService,
    updateProductService,
    deleteProductService
}
from '../../services/admin/productManagementService.js'
const getProductList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const status = req.query.status || '';
        const sort = req.query.sort || 'latest';

        const { products, totalProducts, totalPage, categoriesList } = await getProductListService(page, limit, search, category, status, sort);

        if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
            return res.json({ products, totalProducts, totalPage });
        }

        res.render('Admin/productManagement', {
            products,
            totalProducts,
            totalPage,
            currentPage: page,
            categoriesList,
            search,
            category,
            status,
            sort
        });
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

const addProduct = async (req, res) => {
    try {
        if (req.uploadError) {
            const categories = await getProductAddService();
            return res.render('Admin/addProduct', {
                categories,
                errorMessage: req.uploadError,
                formData: req.body || {}
            });
        }
    
        const keys = Array.isArray(req.body.summaryKey) ? req.body.summaryKey : (req.body.summaryKey ? [req.body.summaryKey] : []);
        const values = Array.isArray(req.body.summaryValue) ? req.body.summaryValue : (req.body.summaryValue ? [req.body.summaryValue] : []);
        const summary = keys
            .map((key, i) => ({
                key: key ? key.trim() : '',
                value: values[i] ? values[i].trim() : ''
            }))
            .filter(item => item.key !== '' || item.value !== '');

        const productData = {
            name: req.body.productName,
            category: req.body.category,
            description: req.body.description,
            basePrice: req.body.basePrice,
            discountedPrice: req.body.discountedPrice,
            sku: req.body.sku,
            status: req.body.status,
            isHidden: req.body.isHidden === 'true',
            summary: summary,
            images: req.files ? req.files.map(file => file.path) : [],
        };

        const newProduct = await addProductService(productData, req.body, req.files);

        res.redirect('/admin/product-management');

    } catch (error) {
        console.log(error);
        const categories = await getProductAddService();
        return res.render('Admin/addProduct', {
            categories,
            errorMessage: error.message,
            formData: req.body || {}
        });
    }
}

const getProductEdit = async (req, res) => {
    try {
        const productId = req.params.id;
        const { categories, product, variants } = await getProductEditDataService(productId);
        res.render('Admin/editProduct', {
            categories,
            product,
            variants
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error loading edit product page: ' + error.message);
    }
}


const updateProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        if (req.uploadError) {
            const { categories, product, variants } = await getProductEditDataService(productId);
            return res.render('Admin/editProduct', {
                categories,
                product,
                variants,
                errorMessage: req.uploadError
            });
        }
        await updateProductService(productId, req.body, req.files);
        res.redirect('/admin/product-management');
    } catch (error) {
        console.log(error);
        try {
            const { categories, product, variants } = await getProductEditDataService(productId);
            return res.render('Admin/editProduct', {
                categories,
                product,
                variants,
                errorMessage: error.message
            });
        } catch (innerError) {
            console.log(innerError);
            res.status(500).send('Error updating product: ' + error.message);
        }
    }
}

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        await deleteProductService(productId);
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Error deleting product' });
    }
};

export {
    getProductList,
    getProductAdd,
    addProduct,
    getProductEdit,
    updateProduct,
    deleteProduct
} 