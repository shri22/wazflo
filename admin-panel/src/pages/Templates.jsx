import { useState, useEffect } from 'react';
import { getTemplates, createTemplate, deleteTemplate } from '../services/api';
import { Plus, Trash2, CheckCircle, Clock, XCircle, Layout } from 'lucide-react';

export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // New Template Form State
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        category: 'MARKETING',
        language: 'en_US',
        header: '',
        body: '',
        footer: '',
        buttonType: 'none',
        buttonText: ''
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const response = await getTemplates();
            setTemplates(response.data.data);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        // Construct standard WhatsApp Template Components
        const components = [];

        if (newTemplate.header) {
            components.push({ type: 'HEADER', format: 'TEXT', text: newTemplate.header });
        }

        components.push({ type: 'BODY', text: newTemplate.body });

        if (newTemplate.footer) {
            components.push({ type: 'FOOTER', text: newTemplate.footer });
        }

        if (newTemplate.buttonType === 'url') {
            components.push({
                type: 'BUTTONS',
                buttons: [{ type: 'URL', text: newTemplate.buttonText, url: 'https://wazflo.com' }]
            });
        }

        try {
            await createTemplate({
                name: newTemplate.name,
                category: newTemplate.category,
                language: newTemplate.language,
                components
            });
            setShowModal(false);
            setNewTemplate({ name: '', category: 'MARKETING', language: 'en_US', header: '', body: '', footer: '', buttonType: 'none', buttonText: '' });
            loadTemplates();
            alert('Template created! (In production this usually takes 1-2 mins for Meta approval)');
        } catch (error) {
            console.error(error);
            alert('Failed to create template');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this template?')) return;
        try {
            await deleteTemplate(id);
            loadTemplates();
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle size={16} className="text-success" />;
            case 'REJECTED': return <XCircle size={16} className="text-danger" />;
            default: return <Clock size={16} className="text-warning" />;
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Message Templates</h1>
                    <p className="page-subtitle">Manage approved WhatsApp templates</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    New Template
                </button>
            </div>

            <div className="grid grid-cols-3 gap-md">
                {templates.map(t => (
                    <div key={t.id} className="card p-md relative group">
                        <div className="flex justify-between items-start mb-sm">
                            <span className="badge badge-secondary text-xs">{t.category}</span>
                            <div className="flex items-center gap-xs text-sm font-bold">
                                {getStatusIcon(t.status)}
                                {t.status}
                            </div>
                        </div>
                        <h3 className="font-bold mb-sm text-lg">{t.name}</h3>

                        <div className="template-preview bg-tertiary p-sm rounded-md mb-md text-sm border-l-4 border-green-500 text-muted">
                            {t.components.find(c => c.type === 'HEADER')?.text && (
                                <div className="font-bold mb-xs">{t.components.find(c => c.type === 'HEADER').text}</div>
                            )}
                            <div className="whitespace-pre-wrap">{t.components.find(c => c.type === 'BODY')?.text}</div>
                            {t.components.find(c => c.type === 'FOOTER')?.text && (
                                <div className="text-xs text-gray-400 mt-xs pt-xs border-t border-gray-700">
                                    {t.components.find(c => c.type === 'FOOTER').text}
                                </div>
                            )}
                            {t.components.find(c => c.type === 'BUTTONS') && (
                                <div className="mt-sm">
                                    <button className="btn btn-sm btn-secondary w-full">
                                        🔗 {t.components.find(c => c.type === 'BUTTONS').buttons[0].text}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-muted mb-sm">Language: {t.language}</div>

                        <button
                            onClick={() => handleDelete(t.id)}
                            className="absolute top-2 right-2 p-xs text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Template</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Template Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. seasonal_sale_offer"
                                        value={newTemplate.name}
                                        onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                        required
                                    />
                                    <p className="text-xs text-muted mt-xs">Lowercase, underscores only.</p>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={newTemplate.category}
                                        onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                    >
                                        <option value="MARKETING">Marketing</option>
                                        <option value="UTILITY">Utility</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Header (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. 🔥 New Collection Alert"
                                    value={newTemplate.header}
                                    onChange={e => setNewTemplate({ ...newTemplate, header: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Body Text (Content)</label>
                                <textarea
                                    className="form-textarea"
                                    rows={4}
                                    placeholder="Hello {{1}}, check out our new arrivals..."
                                    value={newTemplate.body}
                                    onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-muted mt-xs">Use {'{{1}}'}, {'{{2}}'} for variables.</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Footer (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Reply STOP to unsubscribe"
                                    value={newTemplate.footer}
                                    onChange={e => setNewTemplate({ ...newTemplate, footer: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Buttons</label>
                                <div className="flex gap-md">
                                    <select
                                        className="form-select w-1/3"
                                        value={newTemplate.buttonType}
                                        onChange={e => setNewTemplate({ ...newTemplate, buttonType: e.target.value })}
                                    >
                                        <option value="none">None</option>
                                        <option value="url">Link Button</option>
                                    </select>
                                    {newTemplate.buttonType === 'url' && (
                                        <input
                                            type="text"
                                            className="form-input flex-1"
                                            placeholder="Button Text (e.g. View Store)"
                                            value={newTemplate.buttonText}
                                            onChange={e => setNewTemplate({ ...newTemplate, buttonText: e.target.value })}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="mt-lg">
                                <button type="submit" className="btn btn-primary w-full">Submit for Approval</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
