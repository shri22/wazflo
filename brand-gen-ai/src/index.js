const fs = require('fs');
const path = require('path');
require('dotenv').config();
const express = require('express');
const multer = require('multer');

// Services
const IntentClassifier = require('./services/intent_classifier');
const ContentManager = require('./services/content_manager');
const ImageEngine = require('./services/image_engine');
const Compositor = require('./services/compositor');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Data Path
const DATA_FILE = path.join(__dirname, '../data/brands.json');
const LOGOS_DIR = path.join(__dirname, '../assets/logos');
const TEMPLATES_DIR = path.join(__dirname, '../assets/templates');

// Ensure dirs
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Decide folder based on field name or logic
        if (file.fieldname === 'logo') cb(null, LOGOS_DIR);
        else if (file.fieldname === 'template') cb(null, TEMPLATES_DIR);
        else cb(null, LOGOS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

// Helper: Load Brands
function getBrands() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Helper: Save Brands
function saveBrands(brands) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(brands, null, 2));
}

// ---------------------------------------------------------
// ROUTES
// ---------------------------------------------------------

/**
 * GET /api/brands
 * Returns list of brands (for dropdown)
 */
app.get('/api/brands', (req, res) => {
    const brands = getBrands();
    res.json(brands);
});

/**
 * POST /api/brands
 * Create a new brand with logo upload
 */
app.post('/api/brands', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'template', maxCount: 1 }]), (req, res) => {
    try {
        const { name, baseColor, colorHex, theme } = req.body;
        const logoFile = req.files['logo'] ? req.files['logo'][0] : null;
        const templateFile = req.files['template'] ? req.files['template'][0] : null;

        if (!name) return res.status(400).json({ error: "Name is required" });
        // Logo required only for NEW brands
        if (!logoFile) return res.status(400).json({ error: "Logo is required for new brands" });

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const brands = getBrands();

        // Check for duplicate
        if (brands.find(b => b.id === id)) {
            return res.status(409).json({ error: "Brand already exists. Use Edit to update." });
        }

        const newBrand = {
            id,
            name,
            baseColor: baseColor || "Blue",
            colorHex: colorHex || "#0000FF",
            theme: theme || "Modern",
            logoFileName: logoFile.filename,
            activeTemplate: templateFile ? path.join(TEMPLATES_DIR, templateFile.filename) : null
        };

        brands.push(newBrand);
        saveBrands(brands);

        res.json({ success: true, brand: newBrand });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Update Brand
app.put('/api/brands/:id', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'template', maxCount: 1 }]), (req, res) => {
    try {
        const { id } = req.params;
        const { name, baseColor, colorHex, theme } = req.body;
        const logoFile = req.files['logo'] ? req.files['logo'][0] : null;
        const templateFile = req.files['template'] ? req.files['template'][0] : null;

        const brands = getBrands();
        const index = brands.findIndex(b => b.id === id);

        if (index === -1) return res.status(404).json({ error: "Brand not found" });

        const brand = brands[index];
        // Retain old values if not provided
        if (name) brand.name = name;
        if (baseColor) brand.baseColor = baseColor;
        if (colorHex) brand.colorHex = colorHex;
        if (theme) brand.theme = theme;

        if (logoFile) {
            brand.logoFileName = logoFile.filename;
        }
        if (templateFile) {
            brand.activeTemplate = path.join(TEMPLATES_DIR, templateFile.filename);
        } else if (req.body.clearTemplate === 'true') {
            brand.activeTemplate = null; // Remove template
        }

        brands[index] = brand;
        saveBrands(brands);

        res.json({ success: true, brand });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/generate
 * Generates the post
 */
app.post('/api/generate', async (req, res) => {
    try {
        const { brandId, userPrompt } = req.body;
        const brands = getBrands();

        // 1. Validate Brand
        const brandData = brands.find(b => b.id === brandId);
        if (!brandData) return res.status(404).json({ error: 'Brand not found' });

        // Augment brand object with full path for internal services
        const brand = {
            ...brandData,
            logoPath: path.join(LOGOS_DIR, brandData.logoFileName)
            // activeTemplate is already absolute if set via API, or needs resolving if from JSON?
            // In JSON we stored null or path. Wait, existing JSON has null.
            // If we manually set activeTemplate in JSON, we might store just filename later?
            // For now, let's look at how ImageEngine uses it.
        };
        // Fix activeTemplate if it's just a filename (legacy support or future)
        // Check if absolute or relative
        if (brand.activeTemplate && !path.isAbsolute(brand.activeTemplate)) {
            brand.activeTemplate = path.join(TEMPLATES_DIR, brand.activeTemplate);
        }

        console.log(`[Start] Generating for ${brand.name}: "${userPrompt}"`);

        // 2. Intent
        const intent = await IntentClassifier.analyze(userPrompt);

        // 3. Content
        const content = await ContentManager.process(intent, userPrompt, brand);

        // 4. Image
        const backgroundBuffer = await ImageEngine.generateBackground(brand, content);

        // 5. Compose
        const finalImageBuffer = await Compositor.compose(backgroundBuffer, brand, content);

        // Store background buffer for templating
        const generationId = Date.now().toString();
        global.recentGenerations = global.recentGenerations || {};
        global.recentGenerations[generationId] = backgroundBuffer;

        res.set('Content-Type', 'image/png');
        res.set('X-Generation-ID', generationId);
        if (content.reasoning) res.set('X-AI-Reasoning', content.reasoning);
        if (content.source) res.set('X-AI-Source', content.source);

        res.send(finalImageBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Template Saving Routes
app.post('/api/templates/save', express.json(), (req, res) => {
    const { brandId, generationId, name } = req.body;

    if (!global.recentGenerations || !global.recentGenerations[generationId]) {
        return res.status(404).json({ error: "Generation expired" });
    }

    const brands = getBrands();
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return res.status(404).json({ error: "Brand not found" });

    const filename = `${brandId}_${Date.now()}.png`;
    const filepath = path.join(TEMPLATES_DIR, filename);
    fs.writeFileSync(filepath, global.recentGenerations[generationId]);

    // Update Brand in JSON
    brand.savedTemplates = brand.savedTemplates || [];
    brand.savedTemplates.push({ name: name || 'Custom Style', path: filepath });

    // Save updated list to disk
    saveBrands(brands); // Persist!

    res.json({ success: true, message: "Template Saved", path: filepath });
});

app.get('/api/templates/:brandId', (req, res) => {
    const brands = getBrands();
    const brand = brands.find(b => b.id === req.params.brandId);
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    res.json({ templates: brand.savedTemplates || [] });
});

app.post('/api/templates/activate', express.json(), (req, res) => {
    const { brandId, templatePath } = req.body;
    const brands = getBrands();
    const brand = brands.find(b => b.id === brandId);

    if (!brand) return res.status(404).json({ error: "Brand not found" });

    if (templatePath === 'AUTO') {
        brand.activeTemplate = null;
    } else {
        brand.activeTemplate = templatePath;
    }
    saveBrands(brands); // Persist state

    res.json({ success: true, active: brand.activeTemplate });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
