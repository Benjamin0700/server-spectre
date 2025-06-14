// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - rasm fayllari uchun
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/camera_db');
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi');
  } catch (error) {
    console.error('❌ MongoDB ga ulanishda xatolik:', error.message);
    process.exit(1);
  }
};

// Database connection
connectDB();

// Routes
const cameraRoutes = require('./routes/cameraRoutes');
app.use('/api/cameras', cameraRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server ishlayapti',
    timestamp: new Date().toISOString()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: '🎯 Camera API ishlamoqda',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      cameras: {
        getAll: 'GET /api/cameras',
        getById: 'GET /api/cameras/:id',
        create: 'POST /api/cameras',
        update: 'PUT /api/cameras/:id',
        delete: 'DELETE /api/cameras/:id'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint topilmadi: ${req.originalUrl}`,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server xatoligi:', err.stack);
  
  // Multer xatoliklari
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fayl hajmi juda katta (max 5MB)'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Kutilmagan fayl format'
    });
  }
  
  // MongoDB xatoliklari
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validatsiya xatoligi',
      errors: errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Noto\'g\'ri ID format'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Ichki server xatoligi',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server xatoligi'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portda ishlamoqda`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🗂️  API: http://localhost:${PORT}/api/cameras`);
});

module.exports = app;