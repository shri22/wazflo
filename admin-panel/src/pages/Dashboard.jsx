import { useState, useEffect } from 'react';
import { getOrderStats, getOrders, getPlatformStats } from '../services/api';
import { TrendingUp, ShoppingCart, DollarSign, Package, Users, Globe } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [platformStats, setPlatformStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.isSuperAdmin === 1;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (isSuperAdmin) {
                const [pStatsRes, ordersRes] = await Promise.all([
                    getPlatformStats(),
                    getOrders() // This will return all orders for SA or scoped if we changed backend, but currently backend scopes order.getAll by storeId in the controller. Wait, Order.getAll(storeId) in controller uses req.admin.storeId. For SA, storeId is likely the SA's own store. 
                ]);
                setPlatformStats(pStatsRes.data.data);
                // SA might want to see latest orders across ALL stores? 
            } else {
                const [statsRes, ordersRes] = await Promise.all([
                    getOrderStats(),
                    getOrders()
                ]);
                setStats(statsRes.data.data);
                setRecentOrders(ordersRes.data.data.slice(0, 10));
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    const statCardsSummary = isSuperAdmin ? [
        {
            label: 'Total Stores',
            value: platformStats?.totalStores?.count || 0,
            change: platformStats?.activeStores?.count + ' Active',
            icon: Users,
            positive: true
        },
        {
            label: 'Total Platform Revenue',
            value: `₹${platformStats?.totalOrders?.revenue || 0}`,
            change: platformStats?.totalOrders?.count + ' Orders',
            icon: DollarSign,
            positive: true
        },
        {
            label: 'Avg Revenue / Store',
            value: `₹${Math.round((platformStats?.totalOrders?.revenue || 0) / (platformStats?.totalStores?.count || 1))}`,
            change: 'Overall',
            icon: TrendingUp,
            positive: true
        },
        {
            label: 'Platform Reach',
            value: 'All States',
            change: 'National',
            icon: Globe,
            positive: true
        }
    ] : [
        {
            label: 'Today\'s Orders',
            value: stats?.today?.count || 0,
            change: '+12%',
            icon: ShoppingCart,
            positive: true
        },
        {
            label: 'Today\'s Revenue',
            value: `₹${stats?.today?.revenue || 0}`,
            change: '+8%',
            icon: DollarSign,
            positive: true
        },
        {
            label: 'This Week',
            value: stats?.week?.count || 0,
            change: '+23%',
            icon: TrendingUp,
            positive: true
        },
        {
            label: 'This Month',
            value: stats?.month?.count || 0,
            change: '+15%',
            icon: Package,
            positive: true
        }
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back! Here's what's happening with your store.</p>
            </div>

            <div className="stats-grid">
                {statCardsSummary.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="stat-card">
                            <div className="stat-header">
                                <span className="stat-label">{stat.label}</span>
                                <div className="stat-icon">
                                    <Icon size={20} color="white" />
                                </div>
                            </div>
                            <div className="stat-value">{stat.value}</div>
                            <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.change} {isSuperAdmin ? '' : 'from last period'}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">{isSuperAdmin ? 'Top Performing Stores' : 'Recent Orders'}</h2>
                </div>

                {isSuperAdmin ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Store Name</th>
                                    <th>Orders</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {platformStats?.ordersByStore?.map((store, index) => (
                                    <tr key={index}>
                                        <td className="font-bold">{store.name}</td>
                                        <td>{store.order_count}</td>
                                        <td className="font-bold">₹{store.revenue || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    recentOrders.length === 0 ? (
                        <p className="text-muted">No orders yet</p>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Product</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="font-bold">{order.order_number}</td>
                                            <td>{order.customer_name || 'N/A'}</td>
                                            <td>
                                                {order.product_name}
                                                {order.variant_name && <span className="text-muted text-sm"> ({order.variant_name})</span>}
                                            </td>
                                            <td className="font-bold">₹{order.total_amount}</td>
                                            <td>
                                                <span className={`badge badge-${order.status}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="text-sm text-muted">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
