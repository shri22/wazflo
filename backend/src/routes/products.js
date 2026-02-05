import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    deleteVariant,
    uploadProductImage,
    importProducts
} from '../controllers/productController.js';

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// Product routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/import', importProducts);
router.post('/', upload.single('image'), createProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

// Image upload helper
router.post('/upload', upload.single('image'), uploadProductImage);

// Variant routes
router.get('/:id/variants', getProductVariants);
router.post('/:id/variants', createVariant);
router.put('/:id/variants/:variantId', updateVariant);
router.delete('/:id/variants/:variantId', deleteVariant);

export default router;
