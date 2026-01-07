const express = require('express');
const router = express.Router();
const multer = require('multer');
const Mongoose = require('mongoose');

// Bring in Models & Utils
const Product = require('../../models/product');
const Brand = require('../../models/brand');
const Category = require('../../models/category');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const checkAuth = require('../../utils/auth');
const { s3Upload } = require('../../utils/storage');
const {
  getStoreProductsQuery,
  getStoreProductsWishListQuery
} = require('../../utils/queries');
const { ROLES } = require('../../constants');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ========================================
// PUBLIC ROUTES (Most specific first)
// ========================================

// Fetch memorial products (trees, flowers, gifts)
router.get('/list/memorial', async (req, res) => {
  try {
    const { obituaryId, type } = req.query;

    const query = {
      isActive: true
    };

    // Filter by type if specified
    if (type) {
      query.type = type;
    } else {
      // Default to memorial products
      query.type = { $in: ['tree', 'flower', 'gift'] };
    }

    const products = await Product.find(query)
      .populate({
        path: 'brand',
        select: 'name isActive slug'
      })
      .sort({ created: -1 });

    res.status(200).json({
      success: true,
      products,
      obituaryContext: obituaryId ? { obituaryId } : null,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching memorial products:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Fetch product name search
router.get('/list/search/:name', async (req, res) => {
  try {
    const name = req.params.name;

    const productDoc = await Product.find(
      { name: { $regex: new RegExp(name), $options: 'is' }, isActive: true },
      { name: 1, slug: 1, imageUrl: 1, price: 1, _id: 0 }
    );

    if (productDoc.length < 0) {
      return res.status(404).json({
        message: 'No product found.'
      });
    }

    res.status(200).json({
      products: productDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Fetch products select (for dropdowns)
router.get('/list/select', auth, async (req, res) => {
  try {
    const products = await Product.find({}, 'name');

    res.status(200).json({
      products
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Fetch store products by advanced filters
router.get('/list', async (req, res) => {
  try {
    let {
      sortOrder,
      rating,
      max,
      min,
      category,
      brand,
      page = 1,
      limit = 10
    } = req.query;
    sortOrder = JSON.parse(sortOrder);

    const categoryFilter = category ? { category } : {};
    const basicQuery = getStoreProductsQuery(min, max, rating);

    const userDoc = await checkAuth(req);
    const categoryDoc = await Category.findOne({
      slug: categoryFilter.category,
      isActive: true
    });

    if (categoryDoc) {
      basicQuery.push({
        $match: {
          isActive: true,
          _id: {
            $in: Array.from(categoryDoc.products)
          }
        }
      });
    }

    const brandDoc = await Brand.findOne({
      slug: brand,
      isActive: true
    });

    if (brandDoc) {
      basicQuery.push({
        $match: {
          'brand._id': { $eq: brandDoc._id }
        }
      });
    }

    let products = null;
    const productsCount = await Product.aggregate(basicQuery);
    const count = productsCount.length;
    const size = count > limit ? page - 1 : 0;
    const currentPage = count > limit ? Number(page) : 1;

    // paginate query
    const paginateQuery = [
      { $sort: sortOrder },
      { $skip: size * limit },
      { $limit: limit * 1 }
    ];

    if (userDoc) {
      const wishListQuery = getStoreProductsWishListQuery(userDoc.id).concat(
        basicQuery
      );
      products = await Product.aggregate(wishListQuery.concat(paginateQuery));
    } else {
      products = await Product.aggregate(basicQuery.concat(paginateQuery));
    }

    res.status(200).json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage,
      count
    });
  } catch (error) {
    console.log('error', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Fetch product by MongoDB ID (for memorial products without slug)
router.get('/item/id/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate MongoDB ObjectId
    if (!Mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID format.'
      });
    }

    const productDoc = await Product.findOne({
      _id: productId,
      isActive: true
    }).populate({
      path: 'brand',
      select: 'name isActive slug'
    });

    const hasNoBrand =
      productDoc?.brand === null || productDoc?.brand?.isActive === false;

    if (!productDoc || hasNoBrand) {
      return res.status(404).json({
        message: 'No product found.'
      });
    }

    res.status(200).json({
      product: productDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});


// Fetch product by slug
router.get('/item/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const productDoc = await Product.findOne({ slug, isActive: true }).populate({
      path: 'brand',
      select: 'name isActive slug'
    });

    if (!productDoc) {
      return res.status(404).json({
        message: 'No product found.'
      });
    }

    // Only check brand if it exists
    if (productDoc.brand !== null && productDoc.brand?.isActive === false) {
      return res.status(404).json({
        message: 'No product found.'
      });
    }

    res.status(200).json({
      product: productDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// ========================================
// PROTECTED ROUTES (Admin/Merchant only)
// ========================================

// Add product
router.post(
  '/add',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  upload.single('image'),
  async (req, res) => {
    try {
      const {
        sku,
        name,
        description,
        highlights,
        variants,
        taxable,
        brand,
        isActive,
        type
      } = req.body;

      if (!sku || !name || !variants) {
        return res.status(400).json({ error: 'Required fields missing.' });
      }

      const already = await Product.findOne({ sku });
      if (already) {
        return res.status(400).json({ error: 'SKU already exists.' });
      }

      let images = [];

      if (req.file) {
        const { imageUrl, imageKey } = await s3Upload(req.file);
        images.push({
          url: imageUrl,
          key: imageKey,
          alt: name
        });
      }

      const product = new Product({
        sku,
        name,
        description,
        highlights: JSON.parse(highlights),
        variants: JSON.parse(variants),
        taxable,
        brand,
        isActive,
        type,
        images
      });

      await product.save();

      res.status(200).json({
        success: true,
        message: 'Product added successfully',
        product
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        error: 'Something went wrong.'
      });
    }
  }
);

// Fetch all products (admin/merchant)
router.get(
  '/',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      let products = [];

      if (req.user.merchant) {
        const brands = await Brand.find({
          merchant: req.user.merchant
        }).populate('merchant', '_id');

        const brandId = brands[0]?.['_id'];

        products = await Product.find({})
          .populate({
            path: 'brand',
            populate: {
              path: 'merchant',
              model: 'Merchant'
            }
          })
          .where('brand', brandId);
      } else {
        products = await Product.find({}).populate({
          path: 'brand',
          populate: {
            path: 'merchant',
            model: 'Merchant'
          }
        });
      }

      res.status(200).json({
        products
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// Fetch single product by ID (admin/merchant)
router.get(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;

      // Validate MongoDB ObjectId
      if (!Mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          error: 'Invalid product ID format.'
        });
      }

      let productDoc = null;

      if (req.user.merchant) {
        const brands = await Brand.find({
          merchant: req.user.merchant
        }).populate('merchant', '_id');

        const brandId = brands[0]?.['_id'];

        productDoc = await Product.findOne({ _id: productId })
          .populate({
            path: 'brand',
            select: 'name'
          })
          .where('brand', brandId);
      } else {
        productDoc = await Product.findOne({ _id: productId }).populate({
          path: 'brand',
          select: 'name'
        });
      }

      if (!productDoc) {
        return res.status(404).json({
          message: 'No product found.'
        });
      }

      res.status(200).json({
        product: productDoc
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// Update product
router.put(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };
      const { sku, slug } = req.body.product;

      // Validate MongoDB ObjectId
      if (!Mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          error: 'Invalid product ID format.'
        });
      }

      const foundProduct = await Product.findOne({
        $or: [{ slug }, { sku }]
      });

      if (foundProduct && foundProduct._id != productId) {
        return res
          .status(400)
          .json({ error: 'Sku or slug is already in use.' });
      }

      await Product.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Product has been updated successfully!'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// Update product active status
router.put(
  '/:id/active',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };

      // Validate MongoDB ObjectId
      if (!Mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          error: 'Invalid product ID format.'
        });
      }

      await Product.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Product has been updated successfully!'
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

// Delete product
router.delete(
  '/delete/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;

      // Validate MongoDB ObjectId
      if (!Mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          error: 'Invalid product ID format.'
        });
      }

      const product = await Product.deleteOne({ _id: productId });

      res.status(200).json({
        success: true,
        message: `Product has been deleted successfully!`,
        product
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

module.exports = router;