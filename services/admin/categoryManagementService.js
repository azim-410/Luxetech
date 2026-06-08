import categoryModel from '../../model/category.js';


const getCategoryService = async (page, limit, search = '',sort = 'latest') => {
    const query = search ? { categoryName: { $regex: search, $options: 'i' } }: {};

     const sortMap = {
        'latest':  { createdAt: -1 },
        'oldest':  { createdAt:  1 },
        'a-z':     { categoryName:  1 },
        'z-a':     { categoryName: -1 }
    };
    const sortOption = sortMap[sort] || sortMap['latest'];

    const skip = (page - 1) * limit;
    const totalCategories = await categoryModel.countDocuments(query);
    const totalPage = Math.max(1, Math.ceil(totalCategories / limit));
    const categories = await categoryModel
        .find(query)
        .skip(skip)
        .limit(limit)
       .sort(sortOption)

    const totalActive = await categoryModel.countDocuments({ status: true });

    return { categories, totalCategories, totalPage, totalActive };
};

const createCategoryService = async (categoryName, description, status, image, isHidden) => {
    if (!categoryName || categoryName.trim() === '') throw new Error('Category Name is required');
    if (categoryName.trim().length < 3) throw new Error('Category Name must be at least 3 characters');

    const nameRegex = /^[A-Za-z0-9\s]+$/;
    if (!nameRegex.test(categoryName.trim())) {
        throw new Error('Category Name must contain only alphanumeric characters and spaces');
    }

    // Duplicate check only among active categories
    const existingName = await categoryModel.findOne({
        categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
        status: true
    });
    if (existingName) throw new Error('Category name already exists');

    const slug = categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existingSlug = await categoryModel.findOne({ slug, status: true });
    if (existingSlug) throw new Error('Category slug already exists');

    const newCategory = new categoryModel({
        categoryName: categoryName.trim(),
        description: description ? description.trim() : '',
        status: status === 'true' || status === true,
        isHidden: isHidden === 'true' || isHidden === true,
        slug,
        image
    });

    await newCategory.save();
    return { success: true };
};

const editCategoryServices = async (id, categoryName, description, image, isHidden) => {
    if (!categoryName || categoryName.trim() === '') throw new Error('Category Name is required');
    if (categoryName.trim().length < 3) throw new Error('Category Name must be at least 3 characters');

    const nameRegex = /^[A-Za-z0-9\s]+$/;
    if (!nameRegex.test(categoryName.trim())) {
        throw new Error('Category Name must contain only alphanumeric characters and spaces');
    }

    // Duplicate check only among active categories, excluding self
    const existingName = await categoryModel.findOne({
        categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
        status: true,
        _id: { $ne: id }
    });
    if (existingName) throw new Error('Category name already exists');

    const slug = categoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Duplicate slug check only among active categories, excluding self
    const existingSlug = await categoryModel.findOne({ slug, status: true, _id: { $ne: id } });
    if (existingSlug) throw new Error('Category slug already exists');

    const updateData = {
        categoryName: categoryName.trim(),
        description: description ? description.trim() : '',
        slug,
        isHidden: isHidden === 'true' || isHidden === true
    };
    if (image) {
        updateData.image = image;
    }

    const updated = await categoryModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    );

    if (!updated) throw new Error('Category not found');
    return { success: true };
};


const deleteCategoryService = async (id) => {
    const updated = await categoryModel.findByIdAndUpdate(
        id,
        { status: false },
        { new: true }
    );
    if (!updated) throw new Error('Category not found');
    return { success: true };
}

const deleteCategoryImageService = async (id) => {
    const updated = await categoryModel.findByIdAndUpdate(
        id,
        { $unset: { image: "" } },
        { new: true }
    );
    if (!updated) throw new Error('Category not found');
    return { success: true };
};

const toggleCategoryVisibilityService = async (id) => {
    const category = await categoryModel.findById(id);
    if (!category) throw new Error('Category not found');
    const updated = await categoryModel.findByIdAndUpdate(
        id,
        { isHidden: !category.isHidden },
        { new: true }
    );
    if (!updated) throw new Error('Category not found');
    return { success: true, isHidden: updated.isHidden };
};

export {
    getCategoryService,
    createCategoryService,
    editCategoryServices,
    deleteCategoryService,
    deleteCategoryImageService,
    toggleCategoryVisibilityService
}