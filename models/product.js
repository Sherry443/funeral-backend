const mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = mongoose;

mongoose.plugin(slug);

/* Variant Schema */
const VariantSchema = new Schema(
  {
    name: { type: String, required: true }, // Single Tree, Grove of 3
    quantity: { type: Number, required: true }, // 1,3,5,10
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    sku: { type: String },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

/* Image Schema (future multiple images support) */
const ImageSchema = new Schema(
  {
    url: String,
    key: String,
    alt: String
  },
  { _id: false }
);

const ProductSchema = new Schema({
  sku: { type: String, unique: true },

  name: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    slug: 'name',
    unique: true
  },

  type: {
    type: String,
    enum: ['tree', 'flower', 'gift'],
    default: 'tree'
  },

  description: {
    type: String,
    trim: true
  },

  highlights: [String], // bullet points (image wali bullets)

  images: [ImageSchema],

  variants: [VariantSchema],

  taxable: {
    type: Boolean,
    default: false
  },

  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  },

  isActive: {
    type: Boolean,
    default: true
  },

  created: {
    type: Date,
    default: Date.now
  },

  updated: Date
});

module.exports = mongoose.model('Product', ProductSchema);
