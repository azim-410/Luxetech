import categoryModel from '../../model/category.js';


const getCategoryService = async (page,limit) => {

    const skip = (page-1) *5;
    const totalCategories = await categoryModel.find();
    const totalPage =  Math.ceil(totalCategories.length/limit)

    const categories = await categoryModel.find().skip(skip).limit(limit).sort({createdAt:-1})

    console.log('from services cate', totalPage);

   return {categories,totalCategories,totalPage};
}

const createCategoryService = async (categoryName, description, status) => {
    if (!categoryName || categoryName.trim() === '') throw new Error('Category Name is required');
    if (categoryName.trim().length < 3) throw new Error('Category Name must be at least 3 characters');

    const nameRegex = /^[A-Za-z0-9\s]+$/;
    if (!nameRegex.test(categoryName.trim())) {
        throw new Error('Category Name must contain only alphanumeric characters and spaces');
    }

    const existingName = await categoryModel.findOne({ categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') } });
    if (existingName) throw new Error('Category name already exists');

    const slug = categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existingSlug = await categoryModel.findOne({ slug });
    if (existingSlug) throw new Error('Category slug already exists');

    const newCategory = new categoryModel({
        categoryName: categoryName.trim(),
        description: description ? description.trim() : '',
        status: status === 'true' || status === true,
        slug
    });

    await newCategory.save();
    return { success: true };
};

const editCategoryServices = async (id, categoryName, description, status) => {
    if (!categoryName || categoryName.trim() === '') throw new Error('Category Name is required');
    if (categoryName.trim().length < 3) throw new Error('Category Name must be at least 3 characters');

    const nameRegex = /^[A-Za-z0-9\s]+$/;
    if (!nameRegex.test(categoryName.trim())) {
        throw new Error('Category Name must contain only alphanumeric characters and spaces');
    }

    // Check duplicate name, excluding the current category
    const existingName = await categoryModel.findOne({
        categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
        _id: { $ne: id }
    });
    if (existingName) throw new Error('Category name already exists');

    const slug = categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check duplicate slug, excluding the current category
    const existingSlug = await categoryModel.findOne({ slug, _id: { $ne: id } });
    if (existingSlug) throw new Error('Category slug already exists');

    const updated = await categoryModel.findByIdAndUpdate(
        id,
        {
            categoryName: categoryName.trim(),
            description: description ? description.trim() : '',
            status: status === 'true' || status === true,
            slug
        },
        { new: true }
    );

    if (!updated) throw new Error('Category not found');
    return { success: true };
};



export {
    getCategoryService,
    createCategoryService,
    editCategoryServices
}