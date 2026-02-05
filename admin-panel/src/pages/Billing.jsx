
import { useState, useEffect } from 'react';
import { getUsageLogs, getMe } from '../services/api';
import { CreditCard, History, TrendingUp, AlertCircle, PlusCircle } from 'lucide-react';

export default function Billing() {
    const [logs, setLogs] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [logsRes, meRes] = await Promise.all([
                getUsageLogs(),
                getMe()
            ]);
            setLogs(logsRes.data.data);
            setUser(meRes.data.data);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading wallet data...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Billing & Usage</h1>
                    <p className="page-subtitle">Manage your wallet and track message consumption.</p>
                </div>
            </div>

            <div className="billing-grid">
                <div className="card wallet-card highlight">
                    <div className="card-header">
                        <CreditCard className="text-white" />
                        <h2 className="text-white">Wallet Balance</h2>
                    </div>
                    <div className="balance-info">
                        <div className="balance-amount">₹{user?.store?.wallet_balance?.toFixed(2) || '0.00'}</div>
                        <p className="balance-status">
                            {user?.store?.wallet_balance < 50 ? (
                                <span className="warning">
                                    <AlertCircle size={14} /> Low Balance
                                </span>
                            ) : (
                                <span className="healthy">Active</span>
                            )}
                        </p>
                    </div>
                    <button className="btn btn-white w-full">
                        <PlusCircle size={18} /> Recharge Now
                    </button>
                    <p className="pricing-info">Current rate: ₹{user?.store?.message_cost || '0.50'} / conversation</p>
                </div>

                <div className="usage-stats card">
                    <div className="card-header">
                        <TrendingUp className="text-primary" />
                        <h2>Usage Analytics</h2>
                    </div>
                    <div className="stat-rows">
                        <div className="stat-row">
                            <span>Messages Today</span>
                            <span className="font-bold">{logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}</span>
                        </div>
                        <div className="stat-row">
                            <span>Estimated Monthly Cost</span>
                            <span className="font-bold">₹{((logs.length * (user?.store?.message_cost || 0.50)) * 1.5).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card full-width mt-xl">
                <div className="card-header">
                    <History className="text-secondary" />
                    <h2>Transaction History</h2>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Activity</th>
                                <th>Details</th>
                                <th>Cost</th>
                                <th>Balance After</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">No transactions recorded.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.created_at).toLocaleString()}</td>
                                        <td>
                                            <span className="text-xs font-semibold uppercase">
                                                {log.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{log.details}</td>
                                        <td className="text-danger font-bold">- ₹{log.cost.toFixed(2)}</td>
                                        <td className="font-medium">₹{log.balance_after.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .billing-grid {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: var(--spacing-xl);
                }
                .wallet-card {
                    background: linear-gradient(135deg, var(--primary), #10b981);
                    color: white;
                }
                .balance-amount {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin: var(--spacing-md) 0;
                }
                .balance-status {
                    font-size: 0.85rem;
                    margin-bottom: var(--spacing-lg);
                }
                .healthy { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; }
                .warning { background: #fee2e2; color: #ef4444; padding: 4px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; }
                .btn-white {
                    background: white;
                    color: var(--primary);
                    border: none;
                    font-weight: 700;
                    padding: 12px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .btn-white:hover { background: #f8fafc; transform: translateY(-2px); }
                .pricing-info { font-size: 0.75rem; opacity: 0.8; margin-top: 12px; text-align: center; }
                .stat-rows { display: flex; flex-direction: column; gap: 16px; margin-top: var(--spacing-lg); }
                .stat-row { display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
                .text-danger { color: #ef4444; }
                .mt-xl { margin-top: var(--spacing-xl); }
                .w-full { width: 100%; }
            `}</style>
        </div>
    );
}
