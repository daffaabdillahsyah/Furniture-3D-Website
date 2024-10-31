const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const FloorPlan = require('../models/FloorPlan');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../upload'))
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`)
    }
});

const upload = multer({ storage: storage });

// Handle file upload
router.post('/upload', upload.single('floorplan'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        // Construct file path yang benar
        const fileName = req.file.filename;
        const filePath = `/upload/${fileName}`;
        
        // Buat response dengan data model yang lengkap
        const modelData = {
            type: 'floorplan',
            filePath: filePath,
            dimensions: {
                width: 10,
                height: 3,
                depth: 8
            },
            walls: [
                { start: [-5, 0], end: [5, 0] },
                { start: [5, 0], end: [5, 8] },
                { start: [5, 8], end: [-5, 8] },
                { start: [-5, 8], end: [-5, 0] }
            ]
        };

        // Log untuk debugging
        console.log('File uploaded:', {
            originalName: req.file.originalname,
            fileName: fileName,
            filePath: filePath
        });

        console.log('Model data:', modelData);

        // Kirim response dengan data lengkap
        res.json({
            success: true,
            message: 'File uploaded successfully',
            modelData: modelData  // Include complete model data
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing file',
            error: error.message
        });
    }
});

module.exports = router;
