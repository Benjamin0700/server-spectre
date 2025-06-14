// controllers/cameraController.js
const Camera = require('../models/camera');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration - rasm upload uchun
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/cameras/';
    // Papka yo'q bo'lsa yaratish
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Unique filename yaratish
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'camera-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Faqat rasm formatlarini qabul qilish
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari (jpeg, jpg, png, gif, webp) yuklash mumkin'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Barcha kameralarni olish
const getAllCameras = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query;
    
    const query = {};
    
    // Search bo'yicha filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Active status bo'yicha filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const cameras = await Camera.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Camera.countDocuments(query);

    res.json({
      success: true,
      data: cameras,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kameralarni olishda xatolik',
      error: error.message
    });
  }
};

// Bitta kamerani ID bo'yicha olish
const getCameraById = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Kamera topilmadi'
      });
    }

    res.json({
      success: true,
      data: camera
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kamerani olishda xatolik',
      error: error.message
    });
  }
};

// Yangi kamera yaratish
const createCamera = async (req, res) => {
  try {
    const { name, title, description } = req.body;
    
    // Rasm upload qilinganligini tekshirish
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Kamera rasimi majburiy'
      });
    }

    const camera = new Camera({
      name,
      title,
      description,
      image: req.file.filename
    });

    const savedCamera = await camera.save();
    
    res.status(201).json({
      success: true,
      message: 'Kamera muvaffaqiyatli yaratildi',
      data: savedCamera
    });
  } catch (error) {
    // Agar xato bo'lsa, yuklangan faylni o'chirish
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(400).json({
      success: false,
      message: 'Kamera yaratishda xatolik',
      error: error.message
    });
  }
};

// Kamerani yangilash
const updateCamera = async (req, res) => {
  try {
    const { name, title, description, isActive } = req.body;
    
    const camera = await Camera.findById(req.params.id);
    
    if (!camera) {
      // Yangi fayl yuklangan bo'lsa, uni o'chirish
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Kamera topilmadi'
      });
    }

    // Yangi rasm yuklangan bo'lsa, eskisini o'chirish
    if (req.file) {
      const oldImagePath = `uploads/cameras/${camera.image}`;
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      camera.image = req.file.filename;
    }

    // Ma'lumotlarni yangilash
    camera.name = name || camera.name;
    camera.title = title || camera.title;
    camera.description = description || camera.description;
    camera.isActive = isActive !== undefined ? isActive : camera.isActive;

    const updatedCamera = await camera.save();
    
    res.json({
      success: true,
      message: 'Kamera muvaffaqiyatli yangilandi',
      data: updatedCamera
    });
  } catch (error) {
    // Agar xato bo'lsa, yangi yuklangan faylni o'chirish
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(400).json({
      success: false,
      message: 'Kamerani yangilashda xatolik',
      error: error.message
    });
  }
};

// Kamerani o'chirish
const deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    
    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Kamera topilmadi'
      });
    }

    // Rasm faylini o'chirish
    const imagePath = `uploads/cameras/${camera.image}`;
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Camera.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Kamera muvaffaqiyatli o\'chirildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kamerani o\'chirishda xatolik',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  getAllCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera
};