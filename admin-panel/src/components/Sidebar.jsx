import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, LogOut, Settings, CreditCard, LayoutTemplate, X, Send, Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getStores } from '../services/api';

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [activeStoreId, setActiveStoreId] = useState(localStorage.getItem('activeStoreId') || '');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.isSuperAdmin === 1;

    useEffect(() => {
        if (isSuperAdmin) {
            getStores().then(res => setStores(res.data.data)).catch(console.error);
        }
    }, [isSuperAdmin]);

    const handleStoreChange = (e) => {
        const id = e.target.value;
        if (id === '') {
            localStorage.removeItem('activeStoreId');
        } else {
            localStorage.setItem('activeStoreId', id);
        }
        setActiveStoreId(id);
        window.location.reload(); // Refresh to update all data context
    };

    const isTransport = user.industryType === 'TRANSPORT';

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/products', icon: isTransport ? Store : Package, label: isTransport ? 'Fleet' : 'Products' },
        { path: '/orders', icon: isTransport ? LayoutTemplate : ShoppingCart, label: isTransport ? 'Agreements' : 'Orders' },
        { path: '/messages', icon: MessageSquare, label: 'Messages' },
        { path: '/campaigns', icon: Send, label: 'Campaigns' },
        { path: '/templates', icon: LayoutTemplate, label: 'Templates' },
        { path: '/billing', icon: CreditCard, label: 'Billing' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    if (isSuperAdmin) {
        navItems.push({ path: '/stores', icon: Store, label: 'Stores' });
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeStoreId');
        navigate('/login');
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="logo">
                        <img src="/logo.png" alt="W" className="sidebar-logo-img" />
                    </div>
                    <button className="mobile-nav-toggle" onClick={onClose} style={{ marginLeft: 'auto' }}>
                        <X size={24} />
                    </button>
                </div>

                {isSuperAdmin && (
                    <div className="store-switcher" style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Store size={14} color="var(--primary)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-dim)' }}>SWITCH STORE</span>
                        </div>
                        <select
                            value={activeStoreId}
                            onChange={handleStoreChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                            }}
                        >
                            <option value="">Default Admin Store</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, color: 'var(--text-dim)' }}>
                        {isSuperAdmin ? 'Platform Admin' : 'Store Panel'}
                    </span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid var(--border-glass)' }}>
                <button
                    onClick={handleLogout}
                    className="nav-item"
                    style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
