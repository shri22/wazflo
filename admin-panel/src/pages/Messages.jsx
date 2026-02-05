
import { useState, useEffect } from 'react';
import { getMessages } from '../services/api';
import { MessageSquare, Calendar, User, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Messages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await getMessages();
            setMessages(response.data.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading conversation history...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Live Chat Monitor</h1>
                    <p className="page-subtitle">Real-time view of bot conversations with customers.</p>
                </div>
            </div>

            <div className="card full-width">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Customer</th>
                                <th>Direction</th>
                                <th>Message Body</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center">No messages yet.</td>
                                </tr>
                            ) : (
                                messages.map((msg) => (
                                    <tr key={msg.id}>
                                        <td className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-secondary" />
                                                {new Date(msg.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-secondary" />
                                                <div>
                                                    <div className="font-medium">{msg.customer_name || 'Customer'}</div>
                                                    <div className="text-xs text-secondary">{msg.customer_phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {msg.direction === 'in' ? (
                                                <span className="badge badge-info">
                                                    <ArrowLeft size={12} /> Incoming
                                                </span>
                                            ) : (
                                                <span className="badge badge-success">
                                                    Outgoing <ArrowRight size={12} />
                                                </span>
                                            )}
                                        </td>
                                        <td className="max-w-md">
                                            <p className="message-text truncate-multiline">
                                                {msg.body}
                                            </p>
                                        </td>
                                        <td>
                                            <span className="text-xs font-mono uppercase bg-main px-2 py-1 rounded">
                                                {msg.type}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .message-text {
                    font-size: 0.9rem;
                    line-height: 1.4;
                    color: var(--text-main);
                }
                .truncate-multiline {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .badge-info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
                .badge-success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .flex { display: flex; }
                .items-center { align-items: center; }
                .gap-2 { gap: 0.5rem; }
            `}</style>
        </div>
    );
}
