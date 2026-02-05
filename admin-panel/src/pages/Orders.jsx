import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../services/api';
import { Filter, RefreshCw } from 'lucide-react';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [statusFilter, orders]);

    const loadOrders = async () => {
        try {
            const response = await getOrders();
            setOrders(response.data.data);
            setFilteredOrders(response.data.data);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = () => {
        if (statusFilter === 'all') {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(order => order.status === statusFilter));
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            loadOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    const statusOptions = [
        { value: 'all', label: 'All Orders' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'paid', label: 'Paid' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Orders</h1>
                    <p className="page-subtitle">Manage customer orders and track deliveries</p>
                </div>
                <button className="btn btn-secondary" onClick={loadOrders}>
                    <RefreshCw size={20} />
                    Refresh
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="flex items-center gap-md">
                    <Filter size={20} />
                    <label className="form-label" style={{ margin: 0 }}>Filter by Status:</label>
                    <select
                        className="form-select"
                        style={{ maxWidth: '200px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <span className="text-muted text-sm">
                        Showing {filteredOrders.length} of {orders.length} orders
                    </span>
                </div>
            </div>

            <div className="card">
                {filteredOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p className="text-muted">
                            {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter} orders`}
                        </p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Amount</th>
                                    <th>Address</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="font-bold">{order.order_number}</td>
                                        <td>{order.customer_name || 'N/A'}</td>
                                        <td className="text-sm">{order.customer_phone}</td>
                                        <td>
                                            <div className="font-bold">{order.product_name}</div>
                                            {order.variant_name && (
                                                <div className="text-sm text-muted">{order.variant_name}</div>
                                            )}
                                        </td>
                                        <td>{order.quantity}</td>
                                        <td className="font-bold">₹{order.total_amount}</td>
                                        <td className="text-sm" style={{ maxWidth: '200px' }}>{order.address || 'N/A'}</td>
                                        <td>
                                            <span className={`badge badge-${order.status}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="text-sm text-muted">
                                            {new Date(order.created_at).toLocaleString()}
                                        </td>
                                        <td>
                                            <select
                                                className="form-select"
                                                style={{ fontSize: '0.8125rem', padding: '0.375rem 0.5rem' }}
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="paid">Paid</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
