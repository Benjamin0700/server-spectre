// models/Camera.js
const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Camera nomi majburiy'],
    trim: true,
    maxlength: [100, 'Camera nomi 100 ta belgidan oshmasligi kerak']
  },
  title: {
    type: String,
    required: [true, 'Camera title majburiy'],
    trim: true,
    maxlength: [200, 'Title 200 ta belgidan oshmasligi kerak']
  },
  image: {
    type: String,
    required: [true, 'Camera rasimi majburiy']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description 1000 ta belgidan oshmasligi kerak']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual field - image URL ni to'liq path bilan qaytarish
cameraSchema.virtual('imageUrl').get(function() {
  return this.image ? `${process.env.BASE_URL}/uploads/cameras/${this.image}` : null;
});

// JSON qaytarishda virtual fieldlarni ham qaytarish
cameraSchema.set('toJSON', { virtuals: true });
cameraSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Camera', cameraSchema);