import { useState, useEffect } from 'react';
import { getBuses, createBus, updateBus, deleteBus } from '../services/api';
import { Plus, Edit2, Trash2, X, Truck, Info } from 'lucide-react';

export default function Fleet() {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        busNumber: '',
        busType: 'AC',
        capacity: 40,
        baseRate: '',
        isActive: true
    });

    useEffect(() => {
        loadBuses();
    }, []);

    const loadBuses = async () => {
        try {
            const response = await getBuses();
            setBuses(response.data.data);
        } catch (error) {
            console.error('Error loading fleet:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBus) {
                await updateBus(editingBus.id, formData);
            } else {
                await createBus(formData);
            }
            setShowModal(false);
            setEditingBus(null);
            setFormData({ name: '', busNumber: '', busType: 'AC', capacity: 40, baseRate: '', isActive: true });
            loadBuses();
        } catch (error) {
            console.error('Error saving bus:', error);
        }
    };

    const handleEdit = (bus) => {
        setEditingBus(bus);
        setFormData({
            name: bus.name,
            busNumber: bus.busNumber || '',
            busType: bus.busType,
            capacity: bus.capacity,
            baseRate: bus.baseRate,
            isActive: bus.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this bus from fleet?')) return;
        try {
            await deleteBus(id);
            loadBuses();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Fleet Management</h1>
                    <p className="page-subtitle">Manage your buses and availability</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Add Bus
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Bus Name</th>
                                <th>Number</th>
                                <th>Type</th>
                                <th>Capacity</th>
                                <th>Daily Rate</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buses.map((bus) => (
                                <tr key={bus.id}>
                                    <td className="font-bold">{bus.name}</td>
                                    <td>{bus.busNumber || 'N/A'}</td>
                                    <td>
                                        <span className={`badge ${bus.busType === 'AC' ? 'badge-paid' : 'badge-pending'}`}>
                                            {bus.busType}
                                        </span>
                                    </td>
                                    <td>{bus.capacity} Seats</td>
                                    <td className="font-bold">₹{bus.baseRate}</td>
                                    <td>
                                        <span className={`badge ${bus.isActive ? 'badge-paid' : 'badge-cancelled'}`}>
                                            {bus.isActive ? 'Active' : 'Maintenance'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(bus)}><Edit2 size={16} /></button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(bus.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingBus ? 'Edit Bus' : 'Add New Bus'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Bus Name</label>
                                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Bus Number</label>
                                    <input type="text" className="form-input" value={formData.busNumber} onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })} placeholder="TN 01 AB 1234" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Coach Type</label>
                                    <select className="form-select" value={formData.busType} onChange={(e) => setFormData({ ...formData, busType: e.target.value })}>
                                        <option value="AC">AC</option>
                                        <option value="NON-AC">NON-AC</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-2 gap-md">
                                <div className="form-group">
                                    <label className="form-label">Capacity (Seats)</label>
                                    <input type="number" className="form-input" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Per Day Rent (₹)</label>
                                    <input type="number" className="form-input" value={formData.baseRate} onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Availability Status</label>
                                <select className="form-select" value={formData.isActive ? 1 : 0} onChange={(e) => setFormData({ ...formData, isActive: e.target.value == 1 })}>
                                    <option value={1}>Ready for Service</option>
                                    <option value={0}>Under Maintenance</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary w-full mt-lg">
                                {editingBus ? 'Update Fleet' : 'Add to Fleet'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
