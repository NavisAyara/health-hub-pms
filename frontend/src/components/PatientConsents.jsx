import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Shield, Clock, AlertCircle, Building, CheckCircle, XCircle, FileKey } from 'lucide-react';

export default function PatientConsents({ patientId }) {
    const [consents, setConsents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [revokingId, setRevokingId] = useState(null);

    useEffect(() => {
        if (!patientId) return;

        const fetchConsents = async () => {
            setLoading(true);
            try {
                const res = await api(`/api/consents/patient/${patientId}`);
                const data = await res.json();
                if (data.success) {
                    setConsents(data.data);
                } else {
                    setError("Failed to load consents");
                }
            } catch (err) {
                console.error("Error fetching consents:", err);
                setError("Could not load consents.");
            } finally {
                setLoading(false);
            }
        };

        fetchConsents();
    }, [patientId]);

    const handleRevoke = async (consentId) => {
        setRevokingId(consentId);
        try {
            const res = await api(`/api/consents/${consentId}/revoke`, {
                method: 'PATCH'
            });

            if (res.ok) {
                // Update local state to reflect revoked status
                setConsents(prev => prev.map(c =>
                    c.consent_id === consentId ? { ...c, status: 'revoked' } : c
                ));
            } else {
                // If it fails, we just stop loading, creating the effect of "staying as they are"
                console.error("Revoke failed");
            }
        } catch (err) {
            console.error("Error revoking consent:", err);
        } finally {
            setRevokingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Loading consents...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <FileKey size={18} className="text-yellow-600" />
                Active Consents
            </h2>

            {consents.length === 0 ? (
                <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
                    <p className="text-gray-500 text-sm">No consents found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {consents.map(consent => (
                        <div key={consent.consent_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            {/* Left Side: Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Building size={16} className="text-gray-400" />
                                    <h3 className="font-bold text-gray-800 text-base">
                                        {consent.facility?.name || 'Unknown Facility'}
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm text-gray-600 ml-6">
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide
                                        ${consent.consent_type === 'view' ? 'bg-blue-100 text-blue-700' :
                                            consent.consent_type === 'edit' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                        {consent.consent_type}
                                    </span>
                                    <span className="flex items-center gap-1 text-gray-500 text-xs bg-gray-50 px-2 py-0.5 rounded bg-gray-50 border border-gray-100">
                                        <Clock size={12} />
                                        Expires: {formatDate(consent.expires_at)}
                                    </span>
                                </div>
                            </div>

                            {/* Right Side: Status & Action */}
                            <div className="flex flex-col items-end gap-2 min-w-[100px]">
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full capitalize
                                    ${consent.status === 'active'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                    {consent.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                    {consent.status}
                                </span>

                                {consent.status === 'active' && (
                                    <button
                                        onClick={() => handleRevoke(consent.consent_id)}
                                        disabled={revokingId === consent.consent_id}
                                        className="text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-wait border border-transparent hover:border-red-100"
                                    >
                                        {revokingId === consent.consent_id ? 'Revoking...' : 'Revoke'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
