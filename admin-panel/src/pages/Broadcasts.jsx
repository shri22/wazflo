
import { useState, useEffect } from 'react';
import { getBroadcasts, createBroadcast } from '../services/api';
import { Megaphone, Users, Send, Plus, CheckCircle2, Clock } from 'lucide-react';

export default function Broadcasts() {
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newBroadcast, setNewBroadcast] = useState({
        name: '',
        template_name: '',
        target_count: 50
    });

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        try {
            const response = await getBroadcasts();
            setBroadcasts(response.data.data);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createBroadcast(newBroadcast);
            setShowCreate(false);
            fetchBroadcasts();
        } catch (error) {
            alert('Failed to schedule broadcast');
        }
    };

    if (loading) return <div className="loading">Loading marketing data...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Marketing Broadcasts</h1>
                    <p className="page-subtitle">Send template-based messages to your customer lists.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    <Plus size={18} /> New Broadcast
                </button>
            </div>

            {showCreate && (
                <div className="modal-overlay">
                    <div className="modal-content card">
                        <h2>🚀 Schedule New Broadcast</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Campaign Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Diwali Sale 2026"
                                    value={newBroadcast.name}
                                    onChange={e => setNewBroadcast({ ...newBroadcast, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>WhatsApp Template Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. sale_announcement"
                                    value={newBroadcast.template_name}
                                    onChange={e => setNewBroadcast({ ...newBroadcast, template_name: e.target.value })}
                                    required
                                />
                                <p className="field-hint">Must match the template name in Meta Business Manager.</p>
                            </div>
                            <div className="form-group">
                                <label>Target Audience Count</label>
                                <input
                                    type="number"
                                    value={newBroadcast.target_count}
                                    onChange={e => setNewBroadcast({ ...newBroadcast, target_count: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Schedule Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="broadcast-grid">
                {broadcasts.length === 0 ? (
                    <div className="no-data card full-width">
                        <Megaphone size={40} className="text-secondary" />
                        <h3>No broadcasts yet</h3>
                        <p>Launch your first marketing campaign to reach your customers.</p>
                    </div>
                ) : (
                    broadcasts.map(b => (
                        <div key={b.id} className="card broadcast-card">
                            <div className="broadcast-header">
                                <div className="status-badge" data-status={b.status}>
                                    {b.status === 'completed' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                    {b.status.toUpperCase()}
                                </div>
                                <span className="date">{new Date(b.created_at).toLocaleDateString()}</span>
                            </div>
                            <h3>{b.name}</h3>
                            <div className="broadcast-details">
                                <div className="detail-item">
                                    <Send size={14} />
                                    <span>Template: <b>{b.template_name}</b></span>
                                </div>
                                <div className="detail-item">
                                    <Users size={14} />
                                    <span>Audience: <b>{b.target_count}</b> customers</span>
                                </div>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: b.status === 'completed' ? '100%' : '10%' }}></div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .broadcast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .broadcast-card { position: relative; padding: var(--spacing-lg); }
                .broadcast-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .status-badge { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 4px; }
                .status-badge[data-status="completed"] { background: #ecfdf5; color: #10b981; }
                .status-badge[data-status="pending"] { background: #fffbeb; color: #f59e0b; }
                .date { font-size: 0.75rem; color: var(--text-secondary); }
                .broadcast-details { display: flex; flex-direction: column; gap: 8px; margin: 1.2rem 0; }
                .detail-item { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-secondary); }
                .progress-bar { height: 6px; background: var(--bg-main); border-radius: 3px; overflow: hidden; margin-top: 1rem; }
                .progress-fill { height: 100%; background: var(--primary); transition: width 0.3s; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .modal-content { width: 450px; padding: 2rem; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
            `}</style>
        </div>
    );
}
