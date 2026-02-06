import { useState, useEffect } from 'react';
import { getBroadcasts, createBroadcast, getTemplates } from '../services/api'; // Assuming createBroadcast and getTemplates are available
import { Send, Users, Activity, BarChart2, Plus } from 'lucide-react';

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // New Campaign Form
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        template: '',
        segment: 'ALL', // ALL, ACTIVE_LAST_30_DAYS
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [campRes, tempRes] = await Promise.all([
                getBroadcasts(),
                getTemplates()
            ]);
            setCampaigns(campRes.data.data || []); // Adjust based on actual API response structure
            setTemplates(tempRes.data.data || []);
        } catch (error) {
            console.error('Error loading campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const selectedTemplate = templates.find(t => t.name === newCampaign.template);

            await createBroadcast({
                name: newCampaign.name,
                template_name: newCampaign.template,
                target_count: 0, // Backend calculates this based on segment
                status: 'pending',
                scheduled_at: new Date().toISOString()
            });
            setShowModal(false);
            setNewCampaign({ name: '', template: '', segment: 'ALL' });
            loadData();
            alert('Campaign scheduled successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to schedule campaign');
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'badge-paid';
            case 'processing': return 'badge-pending';
            case 'failed': return 'badge-cancelled';
            default: return 'badge-secondary';
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Marketing Campaigns</h1>
                    <p className="page-subtitle">Send broadcasts to your customers</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Send size={20} />
                    New Campaign
                </button>
            </div>

            {/* Campaign Stats Overview */}
            <div className="grid grid-cols-3 gap-md mb-lg">
                <div className="card p-md flex items-center gap-md">
                    <div className="bg-blue-100 p-sm rounded-full text-blue-600">
                        <Send size={24} />
                    </div>
                    <div>
                        <div className="text-muted text-sm">Total Sent</div>
                        <div className="text-xl font-bold">{campaigns.reduce((a, c) => a + (c.target_count || 0), 0)}</div>
                    </div>
                </div>
                <div className="card p-md flex items-center gap-md">
                    <div className="bg-green-100 p-sm rounded-full text-green-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-muted text-sm">Avg. Open Rate</div>
                        <div className="text-xl font-bold">~85%</div>
                    </div>
                </div>
                <div className="card p-md flex items-center gap-md">
                    <div className="bg-purple-100 p-sm rounded-full text-purple-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-muted text-sm">Audience Reach</div>
                        <div className="text-xl font-bold">High</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Campaign Name</th>
                                <th>Template</th>
                                <th>Audience</th>
                                <th>Sent</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map(c => (
                                <tr key={c.id}>
                                    <td className="font-bold">{c.name}</td>
                                    <td>
                                        <span className="text-sm font-mono bg-tertiary px-xs rounded">
                                            {c.template_name}
                                        </span>
                                    </td>
                                    <td>All Customers</td>
                                    <td>{c.target_count || '-'}</td>
                                    <td>
                                        <span className={`badge ${getStatusColor(c.status)}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="text-sm text-muted">
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {campaigns.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center p-lg text-muted">
                                        No campaigns sent yet. Start your first broadcast!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Campaign</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">Campaign Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Diwali Sale Blast"
                                    value={newCampaign.name}
                                    onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Select Template</label>
                                <select
                                    className="form-select"
                                    value={newCampaign.template}
                                    onChange={e => setNewCampaign({ ...newCampaign, template: e.target.value })}
                                    required
                                >
                                    <option value="">-- Choose a Message Template --</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.name}>{t.name} ({t.category})</option>
                                    ))}
                                </select>
                                {templates.length === 0 && (
                                    <p className="text-xs text-danger mt-xs">
                                        No templates found. <a href="/templates" className="underline">Create one first.</a>
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Target Audience</label>
                                <select
                                    className="form-select"
                                    value={newCampaign.segment}
                                    onChange={e => setNewCampaign({ ...newCampaign, segment: e.target.value })}
                                >
                                    <option value="ALL">All Contacts (Everyone)</option>
                                    <option value="ACTIVE_LAST_30_DAYS">Active in last 30 Days</option>
                                    <option value="VIP_CUSTOMERS">VIP Customers (High Value)</option>
                                </select>
                            </div>

                            <div className="bg-tertiary p-md rounded-md mb-lg">
                                <h4 className="text-sm font-bold mb-xs">Estimated Cost</h4>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted text-sm">Targeting ~500 users</span>
                                    <span className="font-bold text-lg">₹400.00</span>
                                </div>
                                <p className="text-xs text-muted mt-xs">Wallet Balance: ₹1,250.00</p>
                            </div>

                            <button type="submit" className="btn btn-primary w-full">
                                <Send size={18} className="mr-xs" />
                                Send Broadcast Now
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
