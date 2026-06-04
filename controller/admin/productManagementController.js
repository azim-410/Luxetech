const getProductList = async (req, res) => {
    try {
        res.render('Admin/productManagement');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching products');
    }
}

export {
    getProductList
}