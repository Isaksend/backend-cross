// controllers/barcodeController.js
const path = require('path');
const fs = require('fs');
const bwipjs = require('bwip-js');
const { exec } = require('child_process');
const Barcode = require('../models/Barcode');
const Furniture = require('../models/Furniture');

// Create directory for barcodes if it doesn't exist
const barcodeDir = path.join(__dirname, '../public/barcodes');
if (!fs.existsSync(barcodeDir)) {
    fs.mkdirSync(barcodeDir, { recursive: true });
}

// Valid barcode types
const validBarcodeTypes = [
    'code128', 'code39', 'ean13', 'ean8', 'upca',
    'upce', 'itf14', 'qrcode', 'datamatrix'
];

// Helper function to generate barcode
const generateBarcodeImage = (barcodeType, data, outputPath) => {
    return new Promise((resolve, reject) => {
        // Validate barcode type
        if (!validBarcodeTypes.includes(barcodeType.toLowerCase())) {
            return reject(new Error(`Invalid barcode type: ${barcodeType}`));
        }

        // Map barcode types to bwip-js format
        const bwipTypeMap = {
            'code128': 'code128',
            'ean13': 'ean13',
            'ean8': 'ean8',
            'upca': 'upca',
            'upce': 'upce',
            'itf14': 'itf14',
            'qrcode': 'qrcode',
            'datamatrix': 'datamatrix'
        };

        const bwipType = bwipTypeMap[barcodeType.toLowerCase()] || barcodeType.toLowerCase();

        // Generate barcode options
        const options = {
            bcid: bwipType,
            text: data,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center'
        };

        // Add EAN/UPC specific options
        if (['ean13', 'ean8', 'upca', 'upce'].includes(bwipType)) {
            options.includetext = true;
            options.textxalign = 'center';
            options.guardwhitespace = true;
        }

        // Generate the barcode
        bwipjs.toBuffer(options, (err, png) => {
            if (err) {
                return reject(err);
            }

            // Save the PNG to file
            fs.writeFile(outputPath, png, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve(outputPath);
            });
        });
    });
};

// Helper function to scan barcode
const scanBarcodeWithZBar = (imagePath) => {
    return new Promise((resolve, reject) => {
        exec(`zbarimg --quiet --raw ${imagePath}`, (error, stdout, stderr) => {
            if (error) {
                if (error.code === 1) {
                    // No barcode found (exit code 1 from zbar)
                    return resolve([]);
                }
                return reject(error);
            }

            // Process the output (format: TYPE:DATA)
            const results = stdout.trim().split('\n').filter(line => line.length > 0);

            if (results.length === 0) {
                return resolve([]);
            }

            const formattedResults = results.map(result => {
                const match = result.match(/^([^:]+):(.+)$/);
                if (match) {
                    const [_, type, data] = match;
                    return {
                        data: data,
                        type: type.toLowerCase()
                    };
                } else {
                    return {
                        data: result,
                        type: 'unknown'
                    };
                }
            });

            resolve(formattedResults);
        });
    });
};

// Get all barcodes
exports.getAllBarcodes = async (req, res) => {
    try {
        const barcodes = await Barcode.find().populate('furniture');
        res.json(barcodes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get barcode by ID
exports.getBarcodeById = async (req, res) => {
    try {
        const barcode = await Barcode.findById(req.params.id).populate('furniture');
        if (!barcode) {
            return res.status(404).json({ error: 'Barcode not found' });
        }
        res.json(barcode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get available barcode types
exports.getBarcodeTypes = async (req, res) => {
    res.json({ types: validBarcodeTypes });
};

// Generate a barcode
exports.generateBarcode = async (req, res) => {
    try {
        const { barcodeType, data, furnitureId } = req.body;

        if (!barcodeType || !data) {
            return res.status(400).json({ error: 'Barcode type and data are required' });
        }

        // Generate unique filename
        const filename = `barcode_${Date.now()}.png`;
        const outputPath = path.join(barcodeDir, filename);

        await generateBarcodeImage(barcodeType, data, outputPath);

        // Create barcode record in database
        const barcode = new Barcode({
            type: barcodeType,
            data: data,
            imageUrl: `/barcodes/${filename}`
        });

        // Link to furniture if provided
        if (furnitureId) {
            const furniture = await Furniture.findById(furnitureId);
            if (!furniture) {
                return res.status(404).json({ error: 'Furniture not found' });
            }
            barcode.furniture = furnitureId;
        }

        await barcode.save();

        res.json({
            success: true,
            message: 'Barcode generated successfully',
            barcode: barcode
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Scan a barcode from uploaded image
exports.scanBarcode = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const imagePath = req.file.path;

        try {
            // Try to use ZBar first
            const results = await scanBarcodeWithZBar(imagePath);

            // Clean up the uploaded file
            fs.unlinkSync(imagePath);

            if (results.length > 0) {
                // Find any matching furniture by barcode data
                let furnitureItems = [];
                for (const result of results) {
                    const barcodes = await Barcode.find({ data: result.data }).populate('furniture');
                    if (barcodes.length > 0) {
                        furnitureItems = furnitureItems.concat(
                            barcodes
                                .filter(b => b.furniture)
                                .map(b => b.furniture)
                        );
                    }
                }

                return res.json({
                    success: true,
                    barcodes: results,
                    matchedFurniture: furnitureItems
                });
            } else {
                return res.json({
                    success: true,
                    barcodes: [],
                    message: 'No barcodes detected in the image'
                });
            }
        } catch (scanError) {
            // If ZBar fails, return error
            console.error('Error scanning barcode:', scanError.message);
            fs.unlinkSync(imagePath);

            return res.status(500).json({
                success: false,
                error: 'Error scanning barcode: ' + scanError.message
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete a barcode
exports.deleteBarcode = async (req, res) => {
    try {
        const barcode = await Barcode.findById(req.params.id);
        if (!barcode) {
            return res.status(404).json({ error: 'Barcode not found' });
        }

        // Delete the image file if it exists
        const imagePath = path.join(barcodeDir, path.basename(barcode.imageUrl));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await barcode.remove();

        res.json({ message: 'Barcode deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};