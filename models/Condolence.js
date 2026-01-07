// ==========================================
// 1. UPDATE: models/Condolence.js
// ==========================================
const mongoose = require('mongoose');

const condolenceSchema = new mongoose.Schema({
    obituaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Obituary',
        required: [true, 'Obituary ID is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },
    message: {
        type: String,
        required: [true, 'Condolence message is required'],
        trim: true
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    hasCandle: {
        type: Boolean,
        default: false
    },
    gestureId: {
        type: String,
        default: null
    },
    gestureDescription: {
        type: String,
        default: null
    },
    isApproved: {
        type: Boolean,
        default: true
    },

    // ========== NEW FIELDS FOR TREE PURCHASES ==========
    type: {
        type: String,
        enum: ['message', 'tree', 'flower', 'gift'],
        default: 'message'
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    productDetails: {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: String,
        productType: String, // tree, flower, gift
        variantName: String,
        quantity: Number,
        totalPrice: Number,
        sku: String
    }
}, {
    timestamps: true
});

// Index for faster queries
condolenceSchema.index({ obituaryId: 1, createdAt: -1 });
condolenceSchema.index({ type: 1 });

module.exports = mongoose.model('Condolence', condolenceSchema);