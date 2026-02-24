import { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings } from '../services/api';
import { Save, Shield, MessageSquare, CreditCard, Copy, Check, Globe } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        name: '',
        whatsapp_phone_number_id: '',
        whatsapp_access_token: '',
        whatsapp_verify_token: '',
        razorpay_key_id: '',
        razorpay_key_secret: '',
        industry_type: 'COMMERCE',
        ai_persona: '',
        external_api_type: 'NONE',
        external_api_url: '',
        external_api_key: '',
        external_api_secret: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await getStoreSettings();
            setSettings(response.data.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateStoreSettings(settings);

            // Update local user industry type for immediate UI change
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.industryType !== settings.industry_type) {
                user.industryType = settings.industry_type;
                localStorage.setItem('user', JSON.stringify(user));
                alert('Industry updated! Refreshing dashboard...');
                window.location.reload();
            } else {
                alert('Settings updated successfully!');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const copyWebhookUrl = () => {
        navigator.clipboard.writeText('https://api.wazflo.com/webhook/whatsapp');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="loading">Loading settings...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Store Settings</h1>
                    <p className="page-subtitle">Configure your WhatsApp and Payment integrations.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="settings-grid">
                <div className="card">
                    <div className="card-header">
                        <MessageSquare className="text-primary" />
                        <h2>Store Configuration</h2>
                    </div>
                    <div className="form-group">
                        <label>Business Module / Industry</label>
                        <select
                            className="form-select"
                            value={settings.industry_type || 'COMMERCE'}
                            onChange={(e) => setSettings({ ...settings, industry_type: e.target.value })}
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border)' }}
                        >
                            <option value="COMMERCE">📦 Bharat Commerce (Retail/Products)</option>
                            <option value="TRANSPORT">🚌 Fleet Booking (Buses/Travels)</option>
                        </select>
                        <p className="field-hint">Note: Changing this will reload your dashboard with different tools.</p>
                    </div>
                    <div className="form-group">
                        <label>Store Name</label>
                        <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                            placeholder="Store Name"
                        />
                    </div>
                    <div className="form-group">
                        <label>WhatsApp Phone Number ID</label>
                        <input
                            type="text"
                            value={settings.whatsapp_phone_number_id}
                            onChange={(e) => setSettings({ ...settings, whatsapp_phone_number_id: e.target.value })}
                            placeholder="Enter WhatsApp Phone ID"
                        />
                    </div>
                    <div className="form-group">
                        <label>Owner Personal Number (For Handoff)</label>
                        <input
                            type="text"
                            value={settings.support_phone || ''}
                            onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                            placeholder="e.g. 919876543210 (with country code)"
                        />
                        <p className="field-hint">Customers will be redirected here when they ask for 'Expert/Support'.</p>
                    </div>
                    <div className="form-group">
                        <label>System User Access Token</label>
                        <textarea
                            value={settings.whatsapp_access_token}
                            onChange={(e) => setSettings({ ...settings, whatsapp_access_token: e.target.value })}
                            placeholder="EAAG...."
                            rows={4}
                        />
                    </div>
                    <div className="form-group">
                        <label>Fast Setup</label>
                        <button type="button" className="fb-connect-btn" onClick={() => alert('Meta Embedded Signup flow will start here. Requires Meta App Review.')}>
                            <Globe size={16} /> Connect with Facebook
                        </button>
                    </div>
                    <div className="webhook-box">
                        <div className="webhook-header">
                            <label>Webhook URL (Callback)</label>
                            <button type="button" onClick={copyWebhookUrl} className="copy-btn">
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <code className="webhook-code">https://api.wazflo.com/webhook/whatsapp</code>
                    </div>
                    <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
                        <label>Verify Token</label>
                        <input type="text" value={settings.whatsapp_verify_token} readOnly />
                        <p className="field-hint">Use this token when setting up your Meta Webhook.</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <CreditCard className="text-blue" />
                        <h2>Razorpay Integration</h2>
                    </div>
                    {/* ... (existing Razorpay fields) ... */}
                    <div className="form-group">
                        <label>Razorpay Key ID</label>
                        <input
                            type="text"
                            value={settings.razorpay_key_id}
                            onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                            placeholder="rzp_live_..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Razorpay Key Secret</label>
                        <input
                            type="password"
                            value={settings.razorpay_key_secret}
                            onChange={(e) => setSettings({ ...settings, razorpay_key_secret: e.target.value })}
                            placeholder="••••••••••••"
                        />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <Save className="text-secondary" />
                        <h2>AI Persona & Branding</h2>
                    </div>
                    <div className="form-group">
                        <label>Bot Personality / AI Persona</label>
                        <textarea
                            value={settings.ai_persona || ''}
                            onChange={(e) => setSettings({ ...settings, ai_persona: e.target.value })}
                            placeholder="e.g. Friendly travel assistant for Airavat Gold Travels. Use a polite tone."
                            rows={3}
                        />
                        <p className="field-hint">Defines how the bot greets and talks to your customers.</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <Globe className="text-accent" />
                        <h2>External API Integration (Transport)</h2>
                    </div>
                    <div className="form-group">
                        <label>External Provider</label>
                        <select
                            className="form-select"
                            value={settings.external_api_type || 'NONE'}
                            onChange={(e) => setSettings({ ...settings, external_api_type: e.target.value })}
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border)' }}
                        >
                            <option value="NONE">🚀 Use Wazflo Internal Fleet Dashboard</option>
                            <option value="BITLA">🚍 Bitla GDS / API</option>
                            <option value="REDBUS">🚃 RedBus / API</option>
                            <option value="GENERIC">🔗 Generic JSON API</option>
                        </select>
                        <p className="field-hint">Choose 'NONE' if you want to manage buses manually in the Wazflo dashboard.</p>
                    </div>

                    {settings.external_api_type !== 'NONE' && (
                        <>
                            <div className="form-group">
                                <label>API Base URL</label>
                                <input
                                    type="text"
                                    value={settings.external_api_url || ''}
                                    onChange={(e) => setSettings({ ...settings, external_api_url: e.target.value })}
                                    placeholder="https://api.provider.com/v1"
                                />
                            </div>
                            <div className="form-group">
                                <label>API Key / Client ID</label>
                                <input
                                    type="text"
                                    value={settings.external_api_key || ''}
                                    onChange={(e) => setSettings({ ...settings, external_api_key: e.target.value })}
                                    placeholder="Enter your API Key"
                                />
                            </div>
                            <div className="form-group">
                                <label>API Secret / Token</label>
                                <input
                                    type="password"
                                    value={settings.external_api_secret || ''}
                                    onChange={(e) => setSettings({ ...settings, external_api_secret: e.target.value })}
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* AUTOMATION RULES SECTION */}
                <div className="card">
                    <div className="card-header">
                        <Globe className="text-purple-500" />
                        <h2>Automation Rules</h2>
                    </div>

                    {/* Welcome Message Rule - Mock UI */}
                    <div className="rule-item">
                        <div className="flex justify-between items-center mb-xs">
                            <label className="font-bold text-sm">Welcome Message</label>
                            <input type="checkbox" className="toggle" checked readOnly />
                        </div>
                        <p className="text-xs text-muted mb-sm">Sent when a new customer says "Hi".</p>
                        <textarea className="form-input text-xs" rows={2} readOnly value="Welcome to our store! Check out our latest collection below 👇" />
                    </div>

                    <div className="border-t border-gray-700 my-md"></div>

                    {/* Abandoned Cart Rule - Mock UI */}
                    <div className="rule-item">
                        <div className="flex justify-between items-center mb-xs">
                            <label className="font-bold text-sm">Abandoned Cart Recovery</label>
                            <input type="checkbox" className="toggle" checked readOnly />
                        </div>
                        <p className="text-xs text-muted mb-sm">Sent 1 hour after inactivity in cart.</p>
                        <textarea className="form-input text-xs" rows={2} readOnly value="👋 Hi! You left items in your cart. Stocks are running low! Type 'CHECKOUT' to complete." />
                    </div>

                    <div className="border-t border-gray-700 my-md"></div>

                    {/* Order Notification Rule - Mock UI */}
                    <div className="rule-item">
                        <div className="flex justify-between items-center mb-xs">
                            <label className="font-bold text-sm">Order Status Updates</label>
                            <input type="checkbox" className="toggle" checked readOnly />
                        </div>
                        <p className="text-xs text-muted">Automatically send WhatsApp alerts for Shipped/Delivered status.</p>
                    </div>

                    <div className="bg-tertiary p-sm rounded mt-md">
                        <p className="text-xs text-muted italic">Advanced keyword rules coming soon.</p>
                    </div>
                </div>

                <div className="actions-bar">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </form>

            <style>{`
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: var(--spacing-xl);
                }
                .text-purple-500 { color: #a855f7; }
                .rule-item { margin-bottom: 12px; }
                .toggle { accent-color: var(--primary); transform: scale(1.2); cursor: pointer; }
                /* ... rest of styles ... */
                .webhook-box {
                    background: var(--bg-main);
                    padding: var(--spacing-md);
                    border-radius: var(--rounded);
                    border: 1px dashed var(--border);
                }
                .webhook-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: var(--spacing-sm);
                }
                .webhook-code {
                    font-family: monospace;
                    font-size: 0.85rem;
                    color: var(--primary);
                    word-break: break-all;
                }
                .copy-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    cursor: pointer;
                }
                .copy-btn:hover { color: var(--primary); }
                .field-hint { font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px; }
                .actions-bar { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
                .alert { display: flex; gap: 12px; padding: 12px; border-radius: 8px; font-size: 0.85rem; }
                .alert-info { background: rgba(0, 123, 255, 0.1); color: #007bff; border: 1px solid rgba(0, 123, 255, 0.2); }
                .text-blue { color: #007bff; }
                .fb-connect-btn {
                    background: #1877f2;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    width: 100%;
                    justify-content: center;
                    transition: opacity 0.2s;
                }
                .fb-connect-btn:hover { opacity: 0.9; }
            `}</style>
        </div>
    );
}
