import { getOrderStats, getOrders, getPlatformStats, getRevenueReport, getAgreementStats, getAgreements, getAgreementRevenueReport, getDynamicDashboard } from '../services/api';
import { TrendingUp, ShoppingCart, DollarSign, Package, Users, Globe, Truck, FileText, Calendar, Box, AlertCircle } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [platformStats, setPlatformStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [revenueReport, setRevenueReport] = useState([]);
    const [dynamicData, setDynamicData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dynamicError, setDynamicError] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.isSuperAdmin === 1;
    const isTransport = user.industryType === 'TRANSPORT';
    const hasDynamic = user.hasDynamicDashboard;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (isSuperAdmin) {
                const [pStatsRes, ordersRes, reportRes] = await Promise.all([
                    getPlatformStats(),
                    getOrders(),
                    getRevenueReport(7)
                ]);
                setPlatformStats(pStatsRes.data.data);
                setRevenueReport(reportRes.data.data);
            } else if (hasDynamic) {
                try {
                    const dynamicRes = await getDynamicDashboard();
                    setDynamicData(dynamicRes.data.data);
                } catch (err) {
                    console.error('Dynamic Dashboard Error:', err);
                    setDynamicError(err.response?.data?.error || 'Failed to load dynamic data');
                }
            } else if (isTransport) {
                const [statsRes, agreeRes, reportRes] = await Promise.all([
                    getAgreementStats(),
                    getAgreements(),
                    getAgreementRevenueReport(7)
                ]);
                setStats(statsRes.data.data);
                setRecentOrders(agreeRes.data.data.slice(0, 10));
                setRevenueReport(reportRes.data.data);
            } else {
                const [statsRes, ordersRes, reportRes] = await Promise.all([
                    getOrderStats(),
                    getOrders(),
                    getRevenueReport(7)
                ]);
                setStats(statsRes.data.data);
                setRecentOrders(ordersRes.data.data.slice(0, 10));
                setRevenueReport(reportRes.data.data);
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

    const iconMap = {
        TrendingUp, ShoppingCart, DollarSign, Package, Users, Globe, Truck, FileText, Calendar, Box
    };

    const getStatCards = () => {
        if (isSuperAdmin) return [
            { label: 'Total Stores', value: platformStats?.totalStores?.count || 0, change: (platformStats?.activeStores?.count || 0) + ' Active', icon: Users, positive: true },
            { label: 'Total Platform Revenue', value: `₹${platformStats?.totalOrders?.revenue || 0}`, change: (platformStats?.totalOrders?.count || 0) + ' Orders', icon: DollarSign, positive: true },
            { label: 'Avg Revenue / Store', value: `₹${Math.round((platformStats?.totalOrders?.revenue || 0) / (platformStats?.totalStores?.count || 1))}`, change: 'Overall', icon: TrendingUp, positive: true },
            { label: 'Platform Reach', value: 'All States', change: 'National', icon: Globe, positive: true }
        ];

        if (hasDynamic && dynamicData?.summary) {
            return dynamicData.summary.map(s => ({
                label: s.label,
                value: s.value,
                change: s.change,
                icon: iconMap[s.icon] || Box,
                positive: !s.negative
            }));
        }

        if (isTransport) return [
            { label: 'Today\'s Bookings', value: stats?.today?.count || 0, change: 'New', icon: Calendar, positive: true },
            { label: 'Today\'s Revenue', value: `₹${stats?.today?.revenue || 0}`, change: 'Confirmed', icon: DollarSign, positive: true },
            { label: 'This Week', value: stats?.week?.count || 0, change: 'Recent trips', icon: TrendingUp, positive: true },
            { label: 'Total Fleet', value: 'Active', change: 'All Vehicles', icon: Truck, positive: true }
        ];

        return [
            { label: 'Today\'s Orders', value: stats?.today?.count || 0, change: '+12%', icon: ShoppingCart, positive: true },
            { label: 'Today\'s Revenue', value: `₹${stats?.today?.revenue || 0}`, change: '+8%', icon: DollarSign, positive: true },
            { label: 'This Week', value: stats?.week?.count || 0, change: '+23%', icon: TrendingUp, positive: true },
            { label: 'This Month', value: stats?.month?.count || 0, change: '+15%', icon: Package, positive: true }
        ];
    };

    const statCardsSummary = getStatCards();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back! Here's what's happening with your store.</p>
            </div>

            {dynamicError && (
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)', borderColor: '#ff3d00' }}>
                    <div className="flex items-center gap-md p-md text-danger">
                        <AlertCircle size={20} />
                        <div>
                            <div className="font-bold">Partner API Connectivity Issue</div>
                            <div className="text-sm opacity-80">{dynamicError}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="stats-grid">
                {statCardsSummary.map((stat, index) => {
                    const Icon = stat.icon || Box;
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
                                {stat.change} {isSuperAdmin || hasDynamic ? '' : 'from last period'}
                            </div>
                        </div>
                    );
                })}
            </div>

            {hasDynamic && dynamicData?.charts?.map((chart, cIdx) => (
                <div key={cIdx} className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div className="card-header">
                        <h2 className="card-title">{chart.title}</h2>
                    </div>
                    <div className="chart-container" style={{
                        height: '250px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '20px',
                        padding: '20px',
                        justifyContent: 'space-around'
                    }}>
                        {chart.data.length === 0 ? (
                            <p className="text-muted">No data points</p>
                        ) : (
                            chart.data.map((point, idx) => {
                                const maxVal = Math.max(...chart.data.map(d => d.value), 1);
                                const height = (point.value / maxVal) * 100;
                                return (
                                    <div key={idx} style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{point.value}</span>
                                        <div style={{
                                            width: '100%',
                                            height: `${height}%`,
                                            background: 'linear-gradient(to top, var(--primary), var(--secondary))',
                                            borderRadius: '4px',
                                            minHeight: '4px',
                                            transition: 'height 1s ease-in-out'
                                        }}></div>
                                        <span style={{ fontSize: '0.7rem', color: 'white' }}>{point.label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ))}

            {!hasDynamic && (
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div className="card-header">
                        <h2 className="card-title">7-Day Revenue Report</h2>
                    </div>
                    <div className="chart-container" style={{
                        height: '250px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '20px',
                        padding: '20px',
                        justifyContent: 'space-around'
                    }}>
                        {revenueReport.length === 0 ? (
                            <p className="text-muted">No data available for this period</p>
                        ) : (
                            revenueReport.map((day, idx) => {
                                const maxRev = Math.max(...revenueReport.map(d => d.revenue), 1000);
                                const height = (day.revenue / maxRev) * 100;
                                return (
                                    <div key={idx} style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>₹{day.revenue}</span>
                                        <div style={{
                                            width: '100%',
                                            height: `${height}%`,
                                            background: 'linear-gradient(to top, var(--primary), var(--secondary))',
                                            borderRadius: '4px',
                                            minHeight: '4px',
                                            transition: 'height 1s ease-in-out'
                                        }}></div>
                                        <span style={{ fontSize: '0.7rem', color: 'white' }}>{day.date.split('-').slice(1).join('/')}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {hasDynamic && dynamicData?.tables?.map((table, tIdx) => (
                <div key={tIdx} className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div className="card-header">
                        <h2 className="card-title">{table.title}</h2>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    {table.columns.map((col, idx) => <th key={idx}>{col}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {table.rows.map((row, rIdx) => (
                                    <tr key={rIdx}>
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className={cIdx === 0 ? 'font-bold' : ''}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {!hasDynamic && (
                <div className="card">
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
                    ) : isTransport ? (
                        recentOrders.length === 0 ? (
                            <p className="text-muted">No bookings yet</p>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Agreement #</th>
                                            <th>Customer</th>
                                            <th>Bus / Type</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>From Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((booking) => (
                                            <tr key={booking.id}>
                                                <td className="font-bold">{booking.agreementId}</td>
                                                <td>{booking.customerName}</td>
                                                <td>
                                                    <div>{booking.bus?.name || 'Bus assigned'}</div>
                                                    <div className="text-xs text-muted">{booking.busType}</div>
                                                </td>
                                                <td className="font-bold">₹{booking.totalAmount}</td>
                                                <td>
                                                    <span className={`badge ${booking.status === 'confirmed' ? 'badge-paid' : 'badge-pending'}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="text-sm text-muted">
                                                    {new Date(booking.fromDate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
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
            )}
        </div>
    );
}
