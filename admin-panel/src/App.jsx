import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Stores from './pages/Stores';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import Billing from './pages/Billing';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { Menu } from 'lucide-react';
import './index.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-container">
            <header className="mobile-header">
                <button className="mobile-nav-toggle" onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <div className="logo" style={{ fontSize: '1.2rem' }}>
                    Wazflo
                </div>
                <div style={{ width: 24 }}></div>
            </header>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {sidebarOpen && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 45 }}
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="/products" element={
                    <ProtectedRoute>
                        <Layout><Products /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="/orders" element={
                    <ProtectedRoute>
                        <Layout><Orders /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="/stores" element={
                    <ProtectedRoute>
                        <Layout><Stores /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Layout><Settings /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="/messages" element={
                    <ProtectedRoute>
                        <Layout><Messages /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="/campaigns" element={
                    <ProtectedRoute>
                        <Layout><Campaigns /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="/templates" element={
                    <ProtectedRoute>
                        <Layout><Templates /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="/billing" element={
                    <ProtectedRoute>
                        <Layout><Billing /></Layout>
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
