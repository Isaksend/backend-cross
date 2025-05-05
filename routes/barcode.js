// routes/barcodes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const barcodeController = require('../controllers/barcodeController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all barcodes
router.get('/barcodes', authMiddleware.authenticate, barcodeController.getAllBarcodes);

// Get barcode by ID
router.get('/barcodes/:id', authMiddleware.authenticate, barcodeController.getBarcodeById);

// Get available barcode types
router.get('/types/list', barcodeController.getBarcodeTypes);

// Generate a barcode
router.post('/generate', authMiddleware.authenticate, barcodeController.generateBarcode);

// Scan a barcode from uploaded image
router.post('/scan', upload.single('image'), barcodeController.scanBarcode);

// Delete a barcode
router.delete('/barcodes/:id', authMiddleware.authenticate, barcodeController.deleteBarcode);

module.exports = router;