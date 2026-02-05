import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, LogOut, Settings, Megaphone, CreditCard, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.isSuperAdmin === 1;

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/products', icon: Package, label: 'Products' },
        { path: '/orders', icon: ShoppingCart, label: 'Orders' },
        { path: '/messages', icon: MessageSquare, label: 'Messages' },
        { path: '/broadcasts', icon: Megaphone, label: 'Broadcasts' },
        { path: '/billing', icon: CreditCard, label: 'Billing' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    if (isSuperAdmin) {
        navItems.push({ path: '/stores', icon: LayoutDashboard, label: 'Stores' });
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
