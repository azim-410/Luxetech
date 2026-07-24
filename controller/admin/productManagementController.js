import {
  getProductAddService,
  addProductService,
  getProductListService,
  getProductEditDataService,
  updateProductService,
  deleteProductService,
} from "../../services/admin/productManagementService.js";
const getProductList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "latest";

    const { products, totalProducts, totalPage, categoriesList } =
      await getProductListService(page, limit, search, category, status, sort);

    if (req.headers["x-requested-with"] === "XMLHttpRequest") {
      return res.json({ products, totalProducts, totalPage });
    }

    res.render("Admin/productManagement", {
      products,
      totalProducts,
      totalPage,
      currentPage: page,
      categoriesList,
      search,
      category,
      status,
      sort,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching products");
  }
};

const getProductAdd = async (req, res) => {
  try {
    const categories = await getProductAddService();
    console.log("from controller categoty =", categories);
    res.render("Admin/addProduct", { categories });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while page rendering");
  }
};

const addProduct = async (req, res) => {
  let categories = [];
  try {
    categories = await getProductAddService();
  } catch (err) {
    console.error("Error fetching categories in addProduct:", err);
  }

  const keys = Array.isArray(req.body.summaryKey)
    ? req.body.summaryKey
    : req.body.summaryKey
      ? [req.body.summaryKey]
      : [];
  const values = Array.isArray(req.body.summaryValue)
    ? req.body.summaryValue
    : req.body.summaryValue
      ? [req.body.summaryValue]
      : [];
  const summary = keys
    .map((key, i) => ({
      key: key ? key.trim() : "",
      value: values[i] ? values[i].trim() : "",
    }))
    .filter((item) => item.key !== "" || item.value !== "");

  const productData = {
    name: req.body.productName,
    category: req.body.category,
    description: req.body.description,
    basePrice: req.body.basePrice,
    discountedPrice: req.body.discountedPrice,
    sku: req.body.sku,
    status: req.body.status,
    isHidden: req.body.isHidden === "true",
    summary: summary,
    images: req.files ? req.files.map((file) => file.path) : [],
  };

  try {
    if (req.uploadError) {
      throw new Error(req.uploadError);
    }

    await addProductService(productData, req.body, req.files);
    return res.redirect("/admin/product-management");
  } catch (error) {
    console.error("Add product error:", error.message);
    return res.render("Admin/addProduct", {
      categories,
      errorMessage: error.message,
      errors: error.errors || { general: error.message },
      product: productData,
      formData: req.body,
    });
  }
};

const getProductEdit = async (req, res) => {
  try {
    const productId = req.params.id;
    const { categories, product, variants } =
      await getProductEditDataService(productId);
    res.render("Admin/editProduct", {
      categories,
      product,
      variants,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading edit product page: " + error.message);
  }
};

const updateProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    if (req.uploadError) {
      throw new Error(req.uploadError);
    }
    await updateProductService(productId, req.body, req.files);
    return res.redirect("/admin/product-management");
  } catch (error) {
    console.error("Update product error:", error.message);

    let categories = [];
    let product = null;
    let variants = [];
    try {
      const editData = await getProductEditDataService(productId);
      categories = editData.categories;
      product = editData.product;
      variants = editData.variants;
    } catch (err) {
      console.error("Error fetching edit data in updateProduct catch:", err);
    }

    // We can override standard fields with submitted fields so user doesn't lose their inputs
    if (product) {
      product.name = req.body.productName || product.name;
      product.category = req.body.category || product.category;
      product.description = req.body.description || product.description;
      product.basePrice = req.body.basePrice || product.basePrice;
      product.discountedPrice =
        req.body.discountedPrice !== undefined
          ? req.body.discountedPrice
          : product.discountedPrice;
    }

    // Parse variants list from submitted body to keep user's inputs
    let submittedVariants = [];
    try {
      if (req.body.variantData) {
        const parsed = JSON.parse(req.body.variantData);
        submittedVariants = parsed.map((v) => {
          const key = `${v.groupName}_${v.option}`;
          // Merge/retain database images or other metadata if matching variant
          const matchingDbVar = variants.find(
            (dv) => String(dv._id) === String(v._id),
          );
          return {
            _id: v._id,
            groupName: v.groupName,
            option: v.option,
            stock: v.units,
            price: v.price,
            sku: v.sku,
            images: matchingDbVar ? matchingDbVar.images : [],
          };
        });
      }
    } catch (e) {
      console.error("Error parsing submitted variants:", e);
    }

    return res.render("Admin/editProduct", {
      categories,
      product,
      variants: submittedVariants.length > 0 ? submittedVariants : variants,
      errorMessage: error.message,
      errors: error.errors || { general: error.message },
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await deleteProductService(productId);
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error deleting product",
      });
  }
};

export {
  getProductList,
  getProductAdd,
  addProduct,
  getProductEdit,
  updateProduct,
  deleteProduct,
};
