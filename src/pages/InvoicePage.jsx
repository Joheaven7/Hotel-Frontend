import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Printer, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const InvoicePage = () => {
    const { paymentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [pdfUrl, setPdfUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInvoice = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/invoices/${paymentId}`, {
                    responseType: 'blob',
                });
                const blob = new Blob([response.data], { type: 'application/pdf' });
                setPdfUrl(URL.createObjectURL(blob));
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };

        loadInvoice();
        return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
    }, [paymentId]);

    const handleDownload = async () => {
        try {
            const response = await apiClient.get(`/invoices/${paymentId}?download=true`, {
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LuxStay_Invoice_${paymentId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Invoice downloaded');
        } catch {
            toast.error('Download failed');
        }
    };

    const handlePrint = () => {
        if (!pdfUrl) return;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
            iframe.contentWindow.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        };
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-3 flex items-center justify-between shadow-soft">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="flex items-center gap-2">
                    <h1 className="text-sm font-semibold text-text-primary hidden sm:block">
                        Invoice
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        disabled={!pdfUrl}
                        className="flex items-center gap-2 px-3 py-2 border border-border rounded-btn text-sm font-medium text-text-primary hover:bg-background transition-colors disabled:opacity-50"
                    >
                        <Printer size={15} /> Print
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!pdfUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Download size={15} /> Download PDF
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 57px)' }}>
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-text-secondary text-sm">Generating invoice...</p>
                    </div>
                ) : error ? (
                    <div className="text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                            <AlertCircle size={28} className="text-error" />
                        </div>
                        <p className="font-semibold text-text-primary">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90"
                        >
                            Go Back
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl shadow-elevated rounded-xl overflow-hidden border border-border">
                        <iframe
                            src={pdfUrl}
                            title="Invoice"
                            className="w-full"
                            style={{ height: '90vh', border: 'none' }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoicePage;