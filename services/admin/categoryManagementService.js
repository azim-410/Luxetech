import categoryModel from '../../model/category.js';


const getCategoryService = async () => {
   const categories = await categoryModel.find();
   console.log('from services cate', categories);
   return categories;
}

export {
    getCategoryService
}