import mongoose from 'mongoose';
import productModel from '../../model/product.js';
import categoryModel from '../../model/category.js';
import variantModel from '../../model/variant.js';

const getProductAddService = async () => {
    const categories = await categoryModel.find();
    return categories;
};

const addProductService = async (productData, body, files) => {

    const errors = {};

    // ─── Basic Validation ───────────────────────────────
    if (!productData.name || productData.name.trim() === '') {
        errors.productName = 'Product name is required';
    } else {
        const nameTrimmed = productData.name.trim();
        if (nameTrimmed.length < 3) {
            errors.productName = 'Product name must be at least 3 characters';
        } else if (nameTrimmed.length > 100) {
            errors.productName = 'Product name cannot exceed 100 characters';
        } else if (!/^[A-Za-z0-9\s\-\'\"\(\)]+$/.test(nameTrimmed)) {
            errors.productName = 'Product name must contain only alphanumeric characters, spaces, hyphens, quotes, or parentheses';
        }
    }

    if (!productData.category || productData.category.trim() === '') {
        errors.category = 'Category is required';
    }

    if (!productData.description || productData.description.trim() === '') {
        errors.description = 'Description is required';
    } else {
        const descTrimmed = productData.description.trim();
        if (descTrimmed.length < 10) {
            errors.description = 'Description must be at least 10 characters';
        } else if (descTrimmed.length > 5000) {
            errors.description = 'Description cannot exceed 5000 characters';
        }
    }

    if (productData.basePrice === undefined || productData.basePrice === null || String(productData.basePrice).trim() === '') {
        errors.basePrice = 'Base price is required';
    } else {
        const baseVal = Number(productData.basePrice);
        if (isNaN(baseVal)) {
            errors.basePrice = 'Base price must be a valid number';
        } else if (baseVal <= 0) {
            errors.basePrice = 'Base price must be greater than 0';
        }
    }

    const discStr = String(productData.discountedPrice || '').trim();
    if (discStr !== '') {
        const discVal = Number(productData.discountedPrice);
        const baseVal = Number(productData.basePrice);
        if (isNaN(discVal)) {
            errors.discountedPrice = 'Discounted price must be a valid number';
        } else if (discVal < 0) {
            errors.discountedPrice = 'Discounted price must be a positive number';
        } else if (!isNaN(baseVal) && discVal >= baseVal) {
            errors.discountedPrice = 'Discounted price must be less than base price';
        }
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
        errors.variants = 'At least one variant is required';
    } else {
        for (const key of variantKeys) {
            const v = variantMap[key];
            const prefix = `variant_${key}`;

            if (!v.sku || v.sku.trim() === '') {
                errors[`${prefix}_sku`] = 'SKU is required';
            } else {
                const skuTrimmed = v.sku.trim();
                if (skuTrimmed.length < 3) {
                    errors[`${prefix}_sku`] = 'SKU must be at least 3 characters';
                } else if (skuTrimmed.length > 30) {
                     errors[`${prefix}_sku`] = 'SKU cannot exceed 30 characters';
                } else if (!/^[A-Za-z0-9\-\_]+$/.test(skuTrimmed)) {
                     errors[`${prefix}_sku`] = 'SKU must be alphanumeric (hyphens and underscores allowed)';
                } else {
                    const existingSku = await variantModel.findOne({ sku: skuTrimmed });
                    if (existingSku) {
                        errors[`${prefix}_sku`] = 'SKU already exists';
                    }
                }
            }

            if (v.units === undefined || v.units === null || String(v.units).trim() === '') {
                errors[`${prefix}_units`] = 'Units is required';
            } else {
                const unitsVal = Number(v.units);
                if (isNaN(unitsVal) || !Number.isInteger(unitsVal) || unitsVal < 0) {
                    errors[`${prefix}_units`] = 'Units must be a non-negative integer';
                }
            }

            if (v.price === undefined || v.price === null || String(v.price).trim() === '') {
                errors[`${prefix}_price`] = 'Price is required';
            } else {
                const priceVal = Number(v.price);
                if (isNaN(priceVal) || priceVal < 0) {
                    errors[`${prefix}_price`] = 'Price must be a non-negative number';
                }
            }

            const imageCount = (variantImageMap[key] || []).length;
            if (imageCount === 0) {
                errors[`${prefix}_images`] = 'At least one image is required';
            } else if (imageCount > 3) {
                errors[`${prefix}_images`] = 'Maximum 3 images allowed';
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        const validationError = new Error('Validation Failed');
        validationError.errors = errors;
        throw validationError;
    }

    // ─── All Validation Passed — Save to DB ─────────────

    // Calculate total stock from variantMap
    let totalStock = 0;
    for (const key of variantKeys) {
        totalStock += Number(variantMap[key].units || 0);
    }
    const isProductInStock = totalStock > 0;

    // Save Product
    const newProduct = new productModel({
        name: productData.name.trim(),
        category: productData.category,
        description: productData.description.trim(),
        basePrice: Number(productData.basePrice),
        discountedPrice: Number(productData.discountedPrice) || 0,
        summary: productData.summary,
        hasVariants: true,
        status: isProductInStock,
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
    const errors = {};

    // ─── Basic Validation ───────────────────────────────
    if (!body.productName || body.productName.trim() === '') {
        errors.productName = 'Product name is required';
    } else {
        const nameTrimmed = body.productName.trim();
        if (nameTrimmed.length < 3) {
            errors.productName = 'Product name must be at least 3 characters';
        } else if (nameTrimmed.length > 100) {
            errors.productName = 'Product name cannot exceed 100 characters';
        } else if (!/^[A-Za-z0-9\s\-\'\"\(\)]+$/.test(nameTrimmed)) {
            errors.productName = 'Product name must contain only alphanumeric characters, spaces, hyphens, quotes, or parentheses';
        }
    }

    if (!body.category || body.category.trim() === '') {
        errors.category = 'Category is required';
    }

    if (!body.description || body.description.trim() === '') {
        errors.description = 'Description is required';
    } else {
        const descTrimmed = body.description.trim();
        if (descTrimmed.length < 10) {
            errors.description = 'Description must be at least 10 characters';
        } else if (descTrimmed.length > 5000) {
            errors.description = 'Description cannot exceed 5000 characters';
        }
    }

    if (body.basePrice === undefined || body.basePrice === null || String(body.basePrice).trim() === '') {
        errors.basePrice = 'Base price is required';
    } else {
        const baseVal = Number(body.basePrice);
        if (isNaN(baseVal)) {
            errors.basePrice = 'Base price must be a valid number';
        } else if (baseVal <= 0) {
            errors.basePrice = 'Base price must be greater than 0';
        }
    }

    const discStr = String(body.discountedPrice || '').trim();
    if (discStr !== '') {
        const discVal = Number(body.discountedPrice);
        const baseVal = Number(body.basePrice);
        if (isNaN(discVal)) {
            errors.discountedPrice = 'Discounted price must be a valid number';
        } else if (discVal < 0) {
            errors.discountedPrice = 'Discounted price must be a positive number';
        } else if (!isNaN(baseVal) && discVal >= baseVal) {
            errors.discountedPrice = 'Discounted price must be less than base price';
        }
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
    const removedImagesList = body.removedImages ? body.removedImages.split(',').map(img => img.trim()).filter(Boolean) : [];

    if (variantData.length === 0) {
        errors.variants = 'At least one variant is required';
    } else {
        for (const v of variantData) {
            const prefix = `variant_${v.groupName}_${v.option}`;

            if (!v.sku || v.sku.trim() === '') {
                errors[`${prefix}_sku`] = 'SKU is required';
            } else {
                const skuTrimmed = v.sku.trim();
                if (skuTrimmed.length < 3) {
                    errors[`${prefix}_sku`] = 'SKU must be at least 3 characters';
                } else if (skuTrimmed.length > 30) {
                    errors[`${prefix}_sku`] = 'SKU cannot exceed 30 characters';
                } else if (!/^[A-Za-z0-9\-\_]+$/.test(skuTrimmed)) {
                    errors[`${prefix}_sku`] = 'SKU must be alphanumeric (hyphens and underscores allowed)';
                } else {
                    const existingSku = await variantModel.findOne({
                        sku: skuTrimmed,
                        _id: { $ne: v._id }
                    });
                    if (existingSku) {
                        errors[`${prefix}_sku`] = 'SKU already exists';
                    }
                }
            }

            if (v.units === undefined || v.units === null || String(v.units).trim() === '') {
                errors[`${prefix}_units`] = 'Units is required';
            } else {
                const unitsVal = Number(v.units);
                if (isNaN(unitsVal) || !Number.isInteger(unitsVal) || unitsVal < 0) {
                    errors[`${prefix}_units`] = 'Units must be a non-negative integer';
                }
            }

            if (v.price === undefined || v.price === null || String(v.price).trim() === '') {
                errors[`${prefix}_price`] = 'Price is required';
            } else {
                const priceVal = Number(v.price);
                if (isNaN(priceVal) || priceVal < 0) {
                    errors[`${prefix}_price`] = 'Price must be a non-negative number';
                }
            }

            const key = `${v.groupName}_${v.option}`;
            const newUploadedImages = variantImageMap[key] || [];
            let totalImages = 0;
            if (v._id) {
                const dbVar = await variantModel.findById(v._id);
                if (dbVar) {
                    const retainedImages = (dbVar.images || []).filter(img => !removedImagesList.includes(img));
                    totalImages = retainedImages.length + newUploadedImages.length;
                }
            } else {
                totalImages = newUploadedImages.length;
            }

            if (totalImages === 0) {
                errors[`${prefix}_images`] = 'At least one image is required';
            } else if (totalImages > 3) {
                errors[`${prefix}_images`] = 'Maximum 3 images allowed';
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        const validationError = new Error('Validation Failed');
        validationError.errors = errors;
        throw validationError;
    }

    // Calculate total stock from variantData
    let totalStock = 0;
    for (const v of variantData) {
        totalStock += Number(v.units || 0);
    }
    const isProductInStock = totalStock > 0;

     await productModel.findByIdAndUpdate(id, {
        name: body.productName.trim(),
        category: body.category,
        description: body.description.trim(),
        basePrice: Number(body.basePrice),
        discountedPrice: Number(body.discountedPrice) || 0,
        summary,
        status: isProductInStock,
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
    product.status = false;
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