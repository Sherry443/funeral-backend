
// ==========================================
// models/Tribute.js
// ==========================================
const mongoose = require('mongoose');

const tributeSchema = new mongoose.Schema({
    obituaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Obituary',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        default: null
    },
    message: {
        type: String,
        required: true
    },
    initial: {
        type: String,
        default: 'G'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    photos: [{
        type: String
    }],
    videos: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Tribute', tributeSchema);