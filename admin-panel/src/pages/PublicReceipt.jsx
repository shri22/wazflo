import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Calendar, MapPin, Truck, Phone, User, Download, FileText } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.wazflo.com/api';

export default function PublicReceipt() {
    const { busId } = useParams();
    const [searchParams] = useSearchParams();
    const agreementId = searchParams.get('id');
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (agreementId) {
            fetchBooking();
        }
    }, [agreementId]);

    const fetchBooking = async () => {
        try {
            // We need a public endpoint to fetch a single agreement by ID
            const res = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/public/agreement/${agreementId}`);
            setBooking(res.data.data);
        } catch (err) {
            console.error('Error fetching receipt:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    if (!booking) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-lg text-center">
            <h1 className="text-2xl font-bold mb-md">Receipt Not Found</h1>
            <p className="text-muted">We couldn't find a booking with ID: {agreementId}</p>
        </div>
    );

    return (
        <div className="receipt-page min-h-screen bg-black text-white p-md flex items-center justify-center">
            <div className="receipt-card max-w-2xl w-full bg-tertiary rounded-xl shadow-2xl overflow-hidden border border-glass">
                <div className="bg-primary p-lg text-center">
                    <CheckCircle size={48} className="mx-auto mb-md text-white" />
                    <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
                    <p className="opacity-80">Agreement ID: {booking.agreementId}</p>
                </div>

                <div className="p-xl">
                    <div className="grid grid-2 gap-xl mb-xl">
                        <div>
                            <div className="text-xs text-muted uppercase font-bold mb-sm">Passenger Name</div>
                            <div className="flex items-center gap-sm text-lg">
                                <User size={18} className="text-primary" />
                                <span>{booking.customerName}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted uppercase font-bold mb-sm">Coach Type</div>
                            <div className="text-lg font-bold text-primary">{booking.busType}</div>
                        </div>
                    </div>

                    <div className="bg-black/40 p-lg rounded-lg border border-glass mb-xl">
                        <div className="grid grid-2 gap-lg">
                            <div>
                                <div className="text-xs text-muted uppercase mb-xs">Journey Date</div>
                                <div className="flex items-center gap-sm font-bold">
                                    <Calendar size={16} />
                                    <span>{new Date(booking.fromDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-muted uppercase mb-xs">Return Date</div>
                                <div className="flex items-center justify-end gap-sm font-bold">
                                    <span>{new Date(booking.toDate).toLocaleDateString()}</span>
                                    <Calendar size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-lg mb-xl">
                        <div className="flex items-start gap-lg">
                            <Truck size={20} className="text-primary mt-xs" />
                            <div>
                                <div className="text-xs text-muted uppercase font-bold mb-xs">Fleet Reserved</div>
                                <div className="text-lg">{booking.bus?.name || 'Assigned Fleet'}</div>
                                <div className="text-sm text-muted">{booking.passengers} Passengers Max</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-lg">
                            <MapPin size={20} className="text-primary mt-xs" />
                            <div>
                                <div className="text-xs text-muted uppercase font-bold mb-xs">Route / Places</div>
                                <div className="text-lg">{booking.placesToCover}</div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-glass pt-xl mt-xl">
                        <div className="flex justify-between items-center mb-xl">
                            <div>
                                <div className="text-sm text-muted">Total Rental Amount</div>
                                <div className="text-3xl font-bold text-primary">₹{booking.totalAmount}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-muted uppercase font-bold">Payment Status</div>
                                <span className="badge badge-paid">PAID</span>
                            </div>
                        </div>

                        <div className="flex gap-md">
                            <button className="btn btn-primary flex-1 py-md gap-sm" onClick={() => window.print()}>
                                <FileText size={18} /> Print Receipt
                            </button>
                            <button className="btn btn-secondary flex-1 py-md gap-sm" onClick={() => alert('PDF generation coming soon!')}>
                                <Download size={18} /> Save PDF
                            </button>
                        </div>
                    </div>

                    <div className="mt-xl pt-lg border-t border-glass text-center">
                        <p className="text-sm text-muted mb-md">Need assistance with your journey?</p>
                        <div className="flex items-center justify-center gap-md">
                            <a href={`tel:${booking.phone}`} className="flex items-center gap-sm text-primary font-bold">
                                <Phone size={16} /> Contact Support
                            </a>
                        </div>
                    </div>
                </div>

                <div className="p-md bg-black/60 text-center text-[10px] text-muted uppercase tracking-widest">
                    Powered by Wazflo Bus Booking Engine
                </div>
            </div>
        </div>
    );
}
