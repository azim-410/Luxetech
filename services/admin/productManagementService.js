import productModal from '../../model/product.js'
import categoryModel from '../../model/category.js'

const getProductAddService = async (req,res) => {
    
    const categories = await categoryModel.find();
    console.log(categories)
    return categories
}

export { getProductAddService }