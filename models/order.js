// ==========================================
// 2. UPDATE: models/Order.js - Add obituary context
// ==========================================
const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const OrderSchema = new Schema({
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Allow guest purchases
  },
  total: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  totalWithTax: {
    type: Number,
    default: 0
  },

  // ========== NEW: OBITUARY CONTEXT ==========
  obituaryId: {
    type: Schema.Types.ObjectId,
    ref: 'Obituary',
    default: null
  },
  obituaryName: {
    type: String,
    default: null
  },
  dedicationMessage: {
    type: String,
    default: null
  },
  condolenceId: {
    type: Schema.Types.ObjectId,
    ref: 'Condolence',
    default: null
  },

  // Stripe Payment Fields
  stripePaymentIntentId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'wallet'],
    default: 'card'
  },

  // Billing & Shipping Details
  billingDetails: {
    name: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    }
  },
  shippingDetails: {
    name: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    }
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  orderNotes: String,
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Order', OrderSchema);
