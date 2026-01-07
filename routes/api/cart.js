const express = require('express');
const router = express.Router();
const Mongoose = require('mongoose');

// Bring in Models & Utils
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const auth = require('../../middleware/auth');
const store = require('../../utils/store');

// Add products to new cart
router.post('/add', auth, async (req, res) => {
  try {
    const user = req.user._id;
    const items = req.body.products;

    // Validate products exist and are active
    const productIds = items.map(item => item.product);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    });

    if (products.length !== items.length) {
      return res.status(400).json({
        error: 'Some products are not available.'
      });
    }

    const productsWithTax = store.caculateItemsSalesTax(items);

    const cart = new Cart({
      user,
      products: productsWithTax
    });

    const cartDoc = await cart.save();

    decreaseQuantity(productsWithTax);

    res.status(200).json({
      success: true,
      cartId: cartDoc.id
    });
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Delete entire cart
router.delete('/delete/:cartId', auth, async (req, res) => {
  try {
    const cartId = req.params.cartId;

    // Validate MongoDB ObjectId
    if (!Mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({
        error: 'Invalid cart ID format.'
      });
    }

    const result = await Cart.deleteOne({
      _id: cartId,
      user: req.user._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Cart not found.'
      });
    }

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Cart delete error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Add product to existing cart
router.post('/add/:cartId', auth, async (req, res) => {
  try {
    const cartId = req.params.cartId;
    const product = req.body.product;

    // Validate MongoDB ObjectId
    if (!Mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({
        error: 'Invalid cart ID format.'
      });
    }

    if (!Mongoose.Types.ObjectId.isValid(product.product)) {
      return res.status(400).json({
        error: 'Invalid product ID format.'
      });
    }

    // Check if product exists and is active
    const productDoc = await Product.findOne({
      _id: product.product,
      isActive: true
    });

    if (!productDoc) {
      return res.status(400).json({
        error: 'Product is not available.'
      });
    }

    const query = {
      _id: cartId,
      user: req.user._id
    };

    const cart = await Cart.findOne(query);

    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found.'
      });
    }

    // Check if product already exists in cart
    const existingProductIndex = cart.products.findIndex(
      item => item.product.toString() === product.product.toString()
    );

    if (existingProductIndex !== -1) {
      // Update existing product quantity
      cart.products[existingProductIndex].quantity += product.quantity || 1;
      cart.products[existingProductIndex].totalPrice += product.totalPrice || 0;
      cart.products[existingProductIndex].totalTax += product.totalTax || 0;
      cart.products[existingProductIndex].priceWithTax += product.priceWithTax || 0;

      await cart.save();
    } else {
      // Add new product
      await Cart.updateOne(query, { $push: { products: product } });
    }

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully.'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Delete product from cart
router.delete('/delete/:cartId/:productId', auth, async (req, res) => {
  try {
    const { cartId, productId } = req.params;

    // Validate MongoDB ObjectIds
    if (!Mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({
        error: 'Invalid cart ID format.'
      });
    }

    if (!Mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID format.'
      });
    }

    const query = {
      _id: cartId,
      user: req.user._id
    };

    const cart = await Cart.findOne(query);

    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found.'
      });
    }

    await Cart.updateOne(
      query,
      { $pull: { products: { product: productId } } }
    );

    res.status(200).json({
      success: true,
      message: 'Product removed from cart successfully.'
    });
  } catch (error) {
    console.error('Delete from cart error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// Get cart by ID
router.get('/:cartId', auth, async (req, res) => {
  try {
    const cartId = req.params.cartId;

    // Validate MongoDB ObjectId
    if (!Mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({
        error: 'Invalid cart ID format.'
      });
    }

    const cart = await Cart.findOne({
      _id: cartId,
      user: req.user._id
    }).populate({
      path: 'products.product',
      select: 'name slug sku price images variants type isActive',
      populate: {
        path: 'brand',
        select: 'name slug isActive'
      }
    });

    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found.'
      });
    }

    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

const decreaseQuantity = products => {
  let bulkOptions = products.map(item => {
    return {
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity } }
      }
    };
  });

  Product.bulkWrite(bulkOptions);
};

module.exports = router;