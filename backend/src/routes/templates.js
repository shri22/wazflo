import express from 'express';
import { getTemplates, createTemplate, deleteTemplate } from '../controllers/templateController.js';

const router = express.Router();

router.get('/', getTemplates);
router.post('/', createTemplate);
router.delete('/:id', deleteTemplate);

export default router;
