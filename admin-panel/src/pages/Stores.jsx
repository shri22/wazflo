import { useState, useEffect } from 'react';
import { getStores, createStore, updateStore, deleteStore } from '../services/api';
import { Plus, X, Globe, Phone, Key, User, Edit2, Trash2, Wallet } from 'lucide-react';
import { addStoreBalance } from '../services/api';

export default function Stores() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        whatsappPhoneNumberId: '',
        whatsappAccessToken: '',
        whatsappVerifyToken: 'WazfloToken',
        razorpayKeyId: '',
        razorpayKeySecret: '',
        adminUsername: '',
        adminPassword: '',
        industryType: 'COMMERCE',
        schemaGetUrl: '',
        submissionPostUrl: '',
        dashboardGetUrl: '',
        externalApiType: 'NONE',
        externalApiUrl: '',
        externalApiKey: ''
    });

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const response = await getStores();
            setStores(response.data.data);
        } catch (error) {
            console.error('Error loading stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (store) => {
        setEditingId(store.id);
        setFormData({
            ...store,
            adminUsername: 'HIDDEN',
            adminPassword: 'HIDDEN'
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this store? This will remove all its data.')) {
            try {
                await deleteStore(id);
                loadStores();
            } catch (error) {
                console.error('Error deleting store:', error);
                alert('Failed to delete store');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateStore(editingId, formData);
            } else {
                await createStore(formData);
            }
            setShowModal(false);
            resetForm();
            loadStores();
        } catch (error) {
            console.error('Error processing store:', error);
            alert('Failed to save store. Check console for details.');
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            whatsappPhoneNumberId: '',
            whatsappAccessToken: '',
            whatsappVerifyToken: 'WazfloToken',
            razorpayKeyId: '',
            razorpayKeySecret: '',
            adminUsername: '',
            adminPassword: '',
            industryType: 'COMMERCE',
            schemaGetUrl: '',
            submissionPostUrl: '',
            dashboardGetUrl: '',
            externalApiType: 'NONE',
            externalApiUrl: '',
            externalApiKey: ''
        });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleAddBalance = async (id, amount) => {
        try {
            await addStoreBalance(id, parseFloat(amount));
            alert('Balance updated!');
            loadStores();
        } catch (error) {
            alert('Failed to update balance');
        }
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
                    <h1 className="page-title">Store Management</h1>
                    <p className="page-subtitle">Manage your SaaS clients and their platform keys</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    Add New Store
                </button>
            </div>

            <div className="card">
                {stores.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p className="text-muted">No stores found. Add your first tenant to get started!</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Store Name</th>
                                    <th>Wallet</th>
                                    <th>Phone Number ID</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map((store) => (
                                    <tr key={store.id}>
                                        <td className="font-bold">
                                            <div className="flex items-center gap-sm">
                                                <Globe size={16} className="text-blue" />
                                                {store.name}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-bold text-success">₹{store.walletBalance?.toFixed(2)}</div>
                                            <button
                                                className="link-btn"
                                                onClick={() => {
                                                    const amt = prompt('Enter amount to add:');
                                                    if (amt) handleAddBalance(store.id, amt);
                                                }}
                                            >
                                                + Add
                                            </button>
                                        </td>
                                        <td>{store.whatsappPhoneNumberId}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span className={`badge ${store.whatsappPhoneNumberId?.startsWith('PENDING') ? 'badge-pending' : 'badge-paid'}`}>
                                                    {store.whatsappPhoneNumberId?.startsWith('PENDING') ? 'Pending Config' : 'Active'}
                                                </span>
                                                {store.schemaGetUrl && (
                                                    <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', fontSize: '0.65rem' }}>
                                                        Dynamic API
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button onClick={() => handleEdit(store)} title="Edit Keys" className="action-btn-edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(store.id)} title="Delete Store" className="action-btn-delete">
                                                    <Trash2 size={18} />
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
                    <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingId ? 'Edit Store Keys' : 'Create New Multi-Tenant Store'}</h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="store-form">
                            <div className="form-section-title">General Information</div>
                            <div className="form-group">
                                <label className="form-label">Store Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., City Grocery"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Industry / Business Type *</label>
                                <select
                                    className="form-input"
                                    value={formData.industryType}
                                    onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
                                    required
                                >
                                    <option value="PLATFORM">Official Wazflo Platform Bot ⭐</option>
                                    <option value="DAKROOT">Dakroot Agency (Marketing & Tech) 🚀</option>
                                    <option value="COMMERCE">Standard E-Commerce (Retail)</option>
                                    <option value="TRANSPORT">Travels & Fleet (Bus Booking)</option>
                                    <option value="DYNAMIC">Dynamic API Partner (Custom Backend)</option>
                                </select>
                            </div>

                            <div className="form-section-title">WhatsApp API Keys</div>
                            <div className="grid grid-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Phone Number ID *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.whatsappPhoneNumberId}
                                        onChange={(e) => setFormData({ ...formData, whatsappPhoneNumberId: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Verify Token</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.whatsappVerifyToken}
                                        onChange={(e) => setFormData({ ...formData, whatsappVerifyToken: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Access Token</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.whatsappAccessToken}
                                    onChange={(e) => setFormData({ ...formData, whatsappAccessToken: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="form-section-title">Razorpay (Optional)</div>
                            <div className="grid grid-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Key ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.razorpayKeyId}
                                        onChange={(e) => setFormData({ ...formData, razorpayKeyId: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Key Secret</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.razorpayKeySecret}
                                        onChange={(e) => setFormData({ ...formData, razorpayKeySecret: e.target.value })}
                                    />
                                </div>
                            </div>

                            {!editingId && (
                                <>
                                    <div className="form-section-title">Admin Account (for the Client)</div>
                                    <div className="grid grid-2 gap-md">
                                        <div className="form-group">
                                            <label className="form-label">Username *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.adminUsername}
                                                onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Password *</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={formData.adminPassword}
                                                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="form-section-title">External API Integration (Native Adapters)</div>
                            <div className="form-group">
                                <label className="form-label">Adapter Type</label>
                                <select
                                    className="form-input"
                                    value={formData.externalApiType}
                                    onChange={(e) => setFormData({ ...formData, externalApiType: e.target.value })}
                                >
                                    <option value="NONE">No External API (Wazflo Native)</option>
                                    <option value="SAI_SENTHIL">Sri Sai Senthil Travels Adapter</option>
                                    <option value="BITLA">Bitla GDS Adapter</option>
                                </select>
                            </div>

                            {formData.external_api_type !== 'NONE' && (
                                <div className="grid grid-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">API Base URL</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.externalApiUrl}
                                            onChange={(e) => setFormData({ ...formData, externalApiUrl: e.target.value })}
                                            placeholder="https://api.partner.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">API Access Token</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.externalApiKey}
                                            onChange={(e) => setFormData({ ...formData, externalApiKey: e.target.value })}
                                            placeholder="Bearer Token"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-section-title">Dynamic API Configuration (Super Admin)</div>
                            <div className="form-group">
                                <label className="form-label">Schema GET URL (Bot Flow)</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={formData.schemaGetUrl || ''}
                                    onChange={(e) => setFormData({ ...formData, schemaGetUrl: e.target.value })}
                                    placeholder="https://partner-api.com/bot-schema"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Submission POST URL (Booking Creation)</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={formData.submissionPostUrl || ''}
                                    onChange={(e) => setFormData({ ...formData, submissionPostUrl: e.target.value })}
                                    placeholder="https://partner-api.com/book"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Dashboard GET URL (Analytics)</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={formData.dashboardGetUrl || ''}
                                    onChange={(e) => setFormData({ ...formData, dashboardGetUrl: e.target.value })}
                                    placeholder="https://partner-api.com/wazflo-dashboard"
                                />
                            </div>

                            <div className="flex gap-md mt-lg">
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingId ? 'Save Changes' : 'Launch New Store'}
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

            <style>{`
                .form-section-title {
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    margin: 1.5rem 0 0.5rem 0;
                    padding-bottom: 0.25rem;
                    border-bottom: 1px dashed var(--border);
                }
                .grid { display: grid; }
                .grid-2 { grid-template-columns: 1fr 1fr; }
                .action-btn-edit { background: none; border: none; color: var(--primary); cursor: pointer; padding: 4px; transition: opacity 0.2s; }
                .action-btn-delete { background: none; border: none; color: #ff3d00; cursor: pointer; padding: 4px; transition: opacity 0.2s; }
                .action-btn-edit:hover, .action-btn-delete:hover { opacity: 0.6; }
                .badge-pending { background: rgba(255, 145, 0, 0.1); color: #ff9100; }
                .link-btn { background: none; border: none; color: var(--primary); font-size: 0.75rem; font-weight: 700; cursor: pointer; padding: 0; }
                .link-btn:hover { text-decoration: underline; }
                .text-success { color: #10b981; }
            `}</style>
        </div>
    );
}
