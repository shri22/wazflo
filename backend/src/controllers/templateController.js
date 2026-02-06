import { Template } from '../models/index.js';

// Get all templates for a store
export const getTemplates = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const templates = await Template.getAll(storeId);

        // Parse components JSON for frontend
        const parsedTemplates = templates.map(t => ({
            ...t,
            components: JSON.parse(t.components)
        }));

        res.json({ success: true, data: parsedTemplates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
};

// Create a new template (Mocking Meta API call)
export const createTemplate = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { name, category, language, components } = req.body;

        if (!name || !components) {
            return res.status(400).json({ success: false, error: 'Name and components are required' });
        }

        // In a real app, we would POST to Meta Graph API here.
        // For now, we simulate success.
        const metaId = `mock_temp_${Date.now()}`;

        const templateId = await Template.create({
            store_id: storeId,
            name: name.toLowerCase().replace(/\s+/g, '_'),
            category,
            language: language || 'en_US',
            components,
            status: 'APPROVED', // Simulating instant approval
            meta_id: metaId
        });

        res.status(201).json({ success: true, message: 'Template created successfully', data: { id: templateId } });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ success: false, error: 'Failed to create template' });
    }
};

// Delete template
export const deleteTemplate = async (req, res) => {
    try {
        const storeId = req.admin.storeId;
        const { id } = req.params;
        await Template.delete(parseInt(id), storeId);
        res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
};
