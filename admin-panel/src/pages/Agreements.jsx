import { useState, useEffect } from 'react';
import { getAgreements, updateAgreementStatus } from '../services/api';
import { FileText, Calendar, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';

export default function Agreements() {
    const [agreements, setAgreements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAgreements();
    }, []);

    const loadAgreements = async () => {
        try {
            const response = await getAgreements();
            setAgreements(response.data.data);
        } catch (error) {
            console.error('Error loading agreements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await updateAgreementStatus(id, status);
            loadAgreements();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Booking Agreements</h1>
                    <p className="page-subtitle">Track bus bookings and travel schedules</p>
                </div>
            </div>

            <div className="grid grid-1 gap-lg">
                {agreements.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p className="text-muted">No bookings found yet.</p>
                    </div>
                ) : (
                    agreements.map((agreement) => (
                        <div key={agreement.id} className="card booking-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                            <div className="flex justify-between items-start mb-md">
                                <div>
                                    <div className="flex items-center gap-sm mb-xs">
                                        <span className="font-bold text-lg">{agreement.agreementId}</span>
                                        <span className={`badge ${agreement.status === 'confirmed' ? 'badge-paid' : 'badge-pending'}`}>
                                            {agreement.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-sm text-sm text-muted">
                                        <Calendar size={14} />
                                        <span>Booked on {formatDate(agreement.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-primary">₹{agreement.totalAmount}</div>
                                    <div className="text-sm text-muted">Total Rental</div>
                                </div>
                            </div>

                            <div className="grid grid-3 gap-lg my-lg p-md" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div>
                                    <div className="text-xs text-muted mb-xs uppercase font-bold">Customer</div>
                                    <div className="flex items-center gap-sm">
                                        <User size={16} />
                                        <div>
                                            <div>{agreement.customerName}</div>
                                            <div className="text-sm text-muted">{agreement.phone}</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted mb-xs uppercase font-bold">Trip Dates</div>
                                    <div className="flex items-center gap-sm">
                                        <Clock size={16} />
                                        <div>
                                            <div className="font-bold">{formatDate(agreement.fromDate)}</div>
                                            <div className="text-sm text-muted">to {formatDate(agreement.toDate)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted mb-xs uppercase font-bold">Fleet Assigned</div>
                                    <div className="flex items-center gap-sm">
                                        <Truck size={16} />
                                        <div>
                                            <div>{agreement.bus?.name || 'Bus Assigned'}</div>
                                            <div className="text-sm text-muted">{agreement.busType} | {agreement.passengers} pax</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-lg">
                                <div className="text-xs text-muted mb-xs uppercase font-bold flex items-center gap-xs">
                                    <MapPin size={12} /> Route / Places to Cover
                                </div>
                                <div className="p-sm" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                    {agreement.placesToCover || 'Direct Point-to-Point'}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-md" style={{ borderTop: '1px solid var(--border-glass)' }}>
                                <a
                                    href={`https://app.wazflo.com/search/book/${agreement.busId}?success=true&id=${agreement.agreementId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary text-sm font-bold flex items-center gap-xs"
                                >
                                    <FileText size={16} /> View/Download Receipt
                                </a>
                                <div className="flex gap-sm">
                                    {agreement.status !== 'cancelled' && (
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => handleStatusChange(agreement.id, 'cancelled')}
                                        >
                                            <XCircle size={14} /> Cancel Booking
                                        </button>
                                    )}
                                    {agreement.status === 'pending' && (
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleStatusChange(agreement.id, 'confirmed')}
                                        >
                                            <CheckCircle size={14} /> Confirm
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
