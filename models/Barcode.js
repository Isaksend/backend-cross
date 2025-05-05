// models/Barcode.js
const mongoose = require('mongoose');

const barcodeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['code128', 'code39', 'ean13', 'ean8', 'upca', 'upce', 'itf14', 'qrcode', 'datamatrix']
    },
    data: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    furniture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Furniture',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Barcode', barcodeSchema);