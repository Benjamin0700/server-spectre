// routes/cameraRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
  upload,
  getAllCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera
} = require('../controllers/cameraController');

// ID validation middleware
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Noto\'g\'ri ID format'
    });
  }
  next();
};

// Validation middleware
const validateCameraData = (req, res, next) => {
  const { name, title } = req.body;
  
  if (!name || !title) {
    return res.status(400).json({
      success: false,
      message: 'Camera nomi va title majburiy'
    });
  }
  
  next();
};

// Routes
// GET /api/cameras - Barcha kameralarni olish
router.get('/', getAllCameras);

// GET /api/cameras/:id - Bitta kamerani olish
router.get('/:id', validateObjectId, getCameraById);

// POST /api/cameras - Yangi kamera yaratish
router.post('/', upload.single('image'), validateCameraData, createCamera);

// PUT /api/cameras/:id - Kamerani yangilash
router.put('/:id', validateObjectId, upload.single('image'), updateCamera);

// DELETE /api/cameras/:id - Kamerani o'chirish
router.delete('/:id', validateObjectId, deleteCamera);

module.exports = router;