import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { getProducts, createProduct, updateProduct, deleteProduct, importProducts } from '../services/api';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon, Share2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        base_price: '',
        image_url: '',
        category: '',
        is_active: 1,
        image: null
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data.data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (results.data.length > 0) {
                    if (confirm(`Ready to import ${results.data.length} products?`)) {
                        setLoading(true);
                        try {
                            const res = await importProducts(results.data);
                            alert(res.data.message);
                            loadProducts();
                        } catch (err) {
                            console.error(err);
                            alert('Import failed. Check console.');
                        } finally {
                            setLoading(false);
                            e.target.value = null; // Reset input
                        }
                    }
                } else {
                    alert('CSV appears to be empty.');
                }
            },
            error: (err) => {
                alert('Error parsing CSV: ' + err.message);
            }
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
            } else {
                await createProduct(formData);
            }

            setShowModal(false);
            setEditingProduct(null);
            resetForm();
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            base_price: product.base_price,
            image_url: product.image_url || '',
            category: product.category || '',
            is_active: product.is_active,
            image: null
        });

        if (product.image_url) {
            const fullImageUrl = product.image_url.startsWith('http')
                ? product.image_url
                : `${BACKEND_URL}${product.image_url}`;
            setImagePreview(fullImageUrl);
        } else {
            setImagePreview(null);
        }

        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await deleteProduct(id);
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        }
    };

    const handleResellerCopy = (product) => {
        // Create Reseller Friendly Caption (No Price, No Contacts)
        const caption = `
🌟 *New Collection: ${product.name}*

${product.description || 'Premium quality fabric, latest design.'}

✅ *Quality check done*
✅ *Ready to dispatch*

*Sizes:* S, M, L, XL
*Fabric:* ${product.category || 'Premium Cotton'}

👇 *Reply for best wholesale rates!*
`;
        navigator.clipboard.writeText(caption);
        alert('Reseller Caption Copied! (Paste this in WhatsApp)');
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            base_price: '',
            image_url: '',
            category: '',
            is_active: 1,
            image: null
        });
        setImagePreview(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        resetForm();
    };

    const getFullImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BACKEND_URL}${url}`;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="page-subtitle">Manage your product catalog</p>
                </div>
                <div className="flex gap-md">
                    <button className="btn btn-secondary" onClick={() => document.getElementById('csv-input').click()}>
                        <Upload size={20} />
                        Import CSV
                    </button>
                    <input
                        id="csv-input"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImport(e)}
                    />
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="card">
                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p className="text-muted">No products yet. Add your first product to get started!</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            {product.image_url ? (
                                                <img
                                                    src={getFullImageUrl(product.image_url)}
                                                    alt={product.name}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        background: 'var(--bg-tertiary)',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'var(--text-muted)'
                                                    }}
                                                >
                                                    <ImageIcon size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="font-bold">{product.name}</div>
                                            <div className="text-sm text-muted">{product.description?.substring(0, 50)}...</div>
                                        </td>
                                        <td>{product.category || 'Uncategorized'}</td>
                                        <td className="font-bold">₹{product.base_price}</td>
                                        <td>
                                            <span className={`badge ${product.is_active ? 'badge-paid' : 'badge-cancelled'}`}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button
                                                    className="btn btn-sm btn-secondary text-purple-600"
                                                    onClick={() => handleResellerCopy(product)}
                                                    title="Copy Reseller Caption (No Price)"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleEdit(product)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(product.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Product Image</label>
                                <div className="flex items-center gap-lg">
                                    <div
                                        className="image-preview-container"
                                        onClick={() => document.getElementById('product-image-input').click()}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" />
                                        ) : (
                                            <div className="image-preview-placeholder">
                                                <Upload size={24} />
                                                <span>Upload Image</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        id="product-image-input"
                                        type="file"
                                        className="image-input-hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-muted mb-lg">
                                            Or provide an external image URL:
                                        </p>
                                        <input
                                            type="url"
                                            className="form-input"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Product Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Base Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g., Electronics, Clothing"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                                >
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>

                            <div className="flex gap-md mt-lg">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
