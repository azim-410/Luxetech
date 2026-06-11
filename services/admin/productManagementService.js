import mongoose from 'mongoose';
import productModel from '../../model/product.js';
import categoryModel from '../../model/category.js';
import variantModel from '../../model/variant.js';

const getProductAddService = async () => {
    const categories = await categoryModel.find();
    return categories;
};

const addProductService = async (productData, body, files) => {

    // ─── Basic Validation ───────────────────────────────
    if (!productData.name || productData.name.trim() === '') {
        throw new Error('Product name is required');
    }
    if (!productData.category) {
        throw new Error('Category is required');
    }
    if (!productData.description || productData.description.trim() === '') {
        throw new Error('Description is required');
    }
    if (!productData.basePrice || isNaN(productData.basePrice)) {
        throw new Error('Valid base price is required');
    }
    if (productData.discountedPrice && isNaN(productData.discountedPrice)) {
        throw new Error('Valid discounted price is required');
    }
    if (Number(productData.discountedPrice) >= Number(productData.basePrice)) {
        throw new Error('Discounted price must be less than base price');
    }

    // ─── Parse Variants from body ───────────────────────
    const variantMap = {};

    Object.keys(body).forEach(key => {
        const match = key.match(/^variant_(.+)_(units|price|sku)$/);
        if (!match) return;

        const field = match[2];
        const middle = match[1];

        if (!variantMap[middle]) {
            variantMap[middle] = {};
        }
        variantMap[middle][field] = body[key];
    });

    // ─── Parse Variant Images from files ────────────────
    const variantImageMap = {};

    if (files && files.length > 0) {
        files.forEach(file => {
            const match = file.fieldname.match(/^variant_(.+)_images$/);
            if (!match) return;
            const key = match[1];
            if (!variantImageMap[key]) {
                variantImageMap[key] = [];
            }
            variantImageMap[key].push(file.path);
        });
    }

    // ─── Variant Validation ─────────────────────────────
    const variantKeys = Object.keys(variantMap);

    if (variantKeys.length === 0) {
        throw new Error('At least one variant is required');
    }

    for (const key of variantKeys) {
        const v = variantMap[key];

        if (!v.sku || v.sku.trim() === '') {
            throw new Error(`SKU is required for variant: ${key}`);
        }
        if (!v.units || isNaN(v.units) || Number(v.units) < 0) {
            throw new Error(`Valid units required for variant: ${key}`);
        }
        if (isNaN(v.price) || Number(v.price) < 0) {
            throw new Error(`Valid price required for variant: ${key}`);
        }
        if (!variantImageMap[key] || variantImageMap[key].length === 0) {
            throw new Error(`At least one image required for variant: ${key}`);
        }

        // Check duplicate SKU
        const existingSku = await variantModel.findOne({ sku: v.sku.trim() });
        if (existingSku) {
            throw new Error(`SKU already exists: ${v.sku}`);
        }
    }

    // ─── All Validation Passed — Save to DB ─────────────

    // Save Product
    const newProduct = new productModel({
        name: productData.name.trim(),
        category: productData.category,
        description: productData.description.trim(),
        basePrice: Number(productData.basePrice),
        discountedPrice: Number(productData.discountedPrice) || 0,
        summary: productData.summary,
        hasVariants: true,
        status: productData.status === 'InStock',
        isHidden: productData.isHidden === true,
    });

    await newProduct.save();

    // Save Variants
    const savedVariants = [];

    for (const key of variantKeys) {
        const v = variantMap[key];

        const lastUnderscore = key.lastIndexOf('_');
        const groupName = key.substring(0, lastUnderscore);
        const option = key.substring(lastUnderscore + 1);

        const newVariant = new variantModel({
            productId: newProduct._id,
            groupName,
            option,
            priceAdd: Number(v.price),
            stock: Number(v.units),
            sku: v.sku.trim(),
            images: variantImageMap[key] || [],
            status: true,
        });

        await newVariant.save();
        savedVariants.push(newVariant);
    }

    return {
        product: newProduct,
        variants: savedVariants,
    };
};

const getProductListService = async (page, limit, search = '', category = '', status = '', sort = 'latest') => {
    // ─── Build Query ───
    const query = {};

    // Search by product name (case-insensitive)
    if (search && search.trim() !== '') {
        query.name = { $regex: search.trim(), $options: 'i' };
    }

    // Filter by Category id
    if (category && category !== '') {
        query.category = category;
    }

    // Filter by status (active or deleted)
    if (status === 'active') {
        query.isDeleted = false;
    } else if (status === 'deleted') {
        query.isDeleted = true;
    }

    // ─── Build Sorting ───
    const sortMap = {
        'latest': { createdAt: -1 },
        'oldest': { createdAt: 1 },
        'price-low-high': { basePrice: 1 },
        'price-high-low': { basePrice: -1 },
        'name-a-z': { name: 1 },
        'name-z-a': { name: -1 }
    };
    const sortOption = sortMap[sort] || sortMap['latest'];

    const skip = (page - 1) * limit;
    const totalProducts = await productModel.countDocuments(query);
    const totalPage = Math.max(1, Math.ceil(totalProducts / limit));
    
    const productsRaw = await productModel
        .find(query)
        .populate('category')
        .collation({ locale: 'en', strength: 2 })
        .skip(skip)
        .limit(limit)
        .sort(sortOption);

    const products = await Promise.all(productsRaw.map(async (product) => {
        const variant = await variantModel.findOne({ productId: product._id });
        const firstImage = (variant && variant.images && variant.images.length > 0) ? variant.images[0] : null;
        return {
            ...product.toObject(),
            firstImage
        };
    }));

    // Fetch list of categories for filter dropdown
    const categoriesList = await categoryModel.find({ status: true });

    return { products, totalProducts, totalPage, categoriesList };
};

const getProductEditDataService = async (productId) => {
    const categories = await categoryModel.find();
    const product = await productModel.findById(productId).populate('category');
    if (!product) {
        throw new Error('Product not found');
    }
    const variants = await variantModel.find({ productId });
    return { categories, product, variants };
};


const updateProductService = async (id, body, files) => {
        // ─── Basic Validation ───────────────────────────────
    if (!body.productName || body.productName.trim() === '') {
        throw new Error('Product name is required');
    }
    if (!body.category) {
        throw new Error('Category is required');
    }
    if (!body.description || body.description.trim() === '') {
        throw new Error('Description is required'); ``
    }
    if (!body.basePrice || isNaN(body.basePrice)) {
        throw new Error('Valid base price is required');
    }
    if (body.discountedPrice && isNaN(body.discountedPrice)) {
        throw new Error('Valid discounted price is required');
    }
    if (Number(body.discountedPrice) >= Number(body.basePrice)) {
        throw new Error('Discounted price must be less than base price');
    }

    // ─── Parse variantData JSON from hidden input ───────
     let variantData = [];
    if (body.variantData) {
        try {
            variantData = JSON.parse(body.variantData);
        } catch (err) {
            throw new Error('Invalid variant data');
        }
    }

     // ─── Parse new variant images from files ────────────
    const variantImageMap = {};
    if (files && files.length > 0) {
        files.forEach(file => {
            const match = file.fieldname.match(/^variant_(.+)_images$/);
            if (!match) return;
            const key = match[1];
            if (!variantImageMap[key]) {
                variantImageMap[key] = [];
            }
            variantImageMap[key].push(file.path);
        });
    }

      // ─── Parse summary ──────────────────────────────────
    const summary = body.summaryKey
        ? (Array.isArray(body.summaryKey)
            ? body.summaryKey.map((key, i) => ({
                key,
                value: body.summaryValue[i]
            }))
            : [{ key: body.summaryKey, value: body.summaryValue }])
        : [];


       // ─── Variant Validation ─────────────────────────────
    for (const v of variantData) {
        if (!v.sku || v.sku.trim() === '') {
            throw new Error(`SKU is required for variant: ${v.groupName} ${v.option}`);
        }
        if (isNaN(v.units) || Number(v.units) < 0) {
            throw new Error(`Valid units required for variant: ${v.groupName} ${v.option}`);
        }
        if (isNaN(v.price) || Number(v.price) < 0) {
            throw new Error(`Valid price required for variant: ${v.groupName} ${v.option}`);
        }

        // Check duplicate SKU — skip if same variant
        const existingSku = await variantModel.findOne({
            sku: v.sku.trim(),
            _id: { $ne: v._id } // exclude itself
        });
        if (existingSku) {
            throw new Error(`SKU already exists: ${v.sku}`);
        }
    }

     await productModel.findByIdAndUpdate(id, {
        name: body.productName.trim(),
        category: body.category,
        description: body.description.trim(),
        basePrice: Number(body.basePrice),
        discountedPrice: Number(body.discountedPrice) || 0,
        summary,
        status: body.status === 'InStock',
        hasVariants: variantData.length > 0,
        isHidden: body.isHidden === 'true',
    });

    // Get existing variant IDs from DB
    const existingVariants = await variantModel.find({ productId: id });
    const existingIds = existingVariants.map(v => v._id.toString());

    // IDs coming from form
    const formIds = variantData
        .filter(v => v._id)
        .map(v => v._id.toString());

    // DELETE — variants in DB but not in form
    const toDelete = existingIds.filter(dbId => !formIds.includes(dbId));
    if (toDelete.length > 0) {
        await variantModel.deleteMany({ _id: { $in: toDelete } });
    }

    const removedImagesList = body.removedImages ? body.removedImages.split(',').map(img => img.trim()).filter(Boolean) : [];

    for (const v of variantData) {
        const key = `${v.groupName}_${v.option}`;
        const newUploadedImages = variantImageMap[key] || [];

        if (v._id) {
            // Update existing variant
            const dbVar = await variantModel.findById(v._id);
            if (dbVar) {
                const retainedImages = (dbVar.images || []).filter(img => !removedImagesList.includes(img));
                dbVar.images = [...retainedImages, ...newUploadedImages];
                dbVar.groupName = v.groupName;
                dbVar.option = v.option;
                dbVar.priceAdd = Number(v.price);
                dbVar.stock = Number(v.units);
                dbVar.sku = v.sku.trim();
                dbVar.status = true;
                await dbVar.save();
            }
        } else {
            // Create new variant
            const newVar = new variantModel({
                productId: id,
                groupName: v.groupName,
                option: v.option,
                priceAdd: Number(v.price),
                stock: Number(v.units),
                sku: v.sku.trim(),
                images: newUploadedImages,
                status: true
            });
            await newVar.save();
        }
    }
}

const deleteProductService = async (productId) => {
    const product = await productModel.findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }
    product.isDeleted = true;
    await product.save();
    await variantModel.updateMany({ productId }, { status: false });
    return { success: true };
};

export { 
    getProductAddService, 
    addProductService, 
    getProductListService, 
    getProductEditDataService, 
    updateProductService,
    deleteProductService
};