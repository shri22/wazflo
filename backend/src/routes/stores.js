import express from 'express';
import { getAllStores, createStore, getStoreSettings, updateStoreSettings, updateStore, deleteStore } from '../controllers/storeController.js';

const router = express.Router();

router.get('/', getAllStores);
router.post('/', createStore);
router.get('/settings', getStoreSettings);
router.put('/settings', updateStoreSettings);
router.put('/:id', updateStore);
router.delete('/:id', deleteStore);

export default router;
