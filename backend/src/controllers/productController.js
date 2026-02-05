import { Product, Variant } from '../models/index.js';

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const products = await Product.getAll(storeId);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
};

// Get product by ID with variants
export const getProductById = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { id } = req.params;
        const product = await Product.getWithVariants(parseInt(id), storeId);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch product' });
    }
};

// Create new product
export const createProduct = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { name, description, base_price, category, is_active } = req.body;
        let image_url = req.body.image_url;

        // Handle file upload
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }

        if (!name || !base_price) {
            return res.status(400).json({ success: false, error: 'Name and base_price are required' });
        }

        const productId = await Product.create({
            store_id: storeId,
            name,
            description,
            base_price: parseFloat(base_price),
            image_url,
            category,
            is_active: is_active !== undefined ? is_active : 1
        });

        const product = await Product.getById(productId, storeId);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, error: 'Failed to create product' });
    }
};

// Import products from CSV JSON (Parsed in frontend)
export const importProducts = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { products } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, error: 'No products provided' });
        }

        // Map fields and validate minimal requirements
        const cleanProducts = products.map(p => ({
            store_id: storeId,
            name: p.name || p.Name || 'Untitled Product',
            description: p.description || p.Description || '',
            base_price: parseFloat(p.price || p.Price || p.base_price || 0),
            image_url: p.image_url || p.Image || '',
            category: p.category || p.Category || 'General'
        })).filter(p => p.base_price > 0);

        const result = await Product.batchCreate(cleanProducts);

        res.json({
            success: true,
            message: `Imported ${result.successCount} products successfully.`,
            errors: result.errors
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ success: false, error: 'Import failed' });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { id } = req.params;
        const { name, description, base_price, category, is_active } = req.body;
        let image_url = req.body.image_url;

        // Handle file upload
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }

        const existing = await Product.getById(parseInt(id), storeId);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        await Product.update(parseInt(id), {
            name,
            description,
            base_price: parseFloat(base_price),
            image_url: image_url || existing.image_url,
            category,
            is_active: is_active !== undefined ? is_active : existing.is_active
        }, storeId);

        const product = await Product.getById(parseInt(id), storeId);
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, error: 'Failed to update product' });
    }
};

// Upload standalone product image
export const uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload an image' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ success: true, data: { imageUrl } });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ success: false, error: 'Failed to upload image' });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { id } = req.params;

        const existing = await Product.getById(parseInt(id), storeId);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        await Product.delete(parseInt(id), storeId);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
};

// Get variants for a product
export const getProductVariants = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { id } = req.params;
        const variants = await Variant.getByProductId(parseInt(id), storeId);
        res.json({ success: true, data: variants });
    } catch (error) {
        console.error('Error fetching variants:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch variants' });
    }
};

// Create variant
export const createVariant = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { id } = req.params;
        const { name, sku, price, stock_quantity, attributes } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Name and price are required' });
        }

        const variantId = await Variant.create({
            product_id: parseInt(id),
            store_id: storeId,
            name,
            sku,
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity) || 0,
            attributes
        });

        const variant = await Variant.getById(variantId, storeId);
        res.status(201).json({ success: true, data: variant });
    } catch (error) {
        console.error('Error creating variant:', error);
        res.status(500).json({ success: false, error: 'Failed to create variant' });
    }
};

// Update variant
export const updateVariant = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { variantId } = req.params;
        const { name, sku, price, stock_quantity, attributes } = req.body;

        const existing = await Variant.getById(parseInt(variantId), storeId);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Variant not found' });
        }

        await Variant.update(parseInt(variantId), {
            name,
            sku,
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity),
            attributes
        }, storeId);

        const variant = await Variant.getById(parseInt(variantId), storeId);
        res.json({ success: true, data: variant });
    } catch (error) {
        console.error('Error updating variant:', error);
        res.status(500).json({ success: false, error: 'Failed to update variant' });
    }
};

// Delete variant
export const deleteVariant = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { variantId } = req.params;

        const existing = await Variant.getById(parseInt(variantId), storeId);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Variant not found' });
        }

        await Variant.delete(parseInt(variantId), storeId);
        res.json({ success: true, message: 'Variant deleted successfully' });
    } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(500).json({ success: false, error: 'Failed to delete variant' });
    }
};
