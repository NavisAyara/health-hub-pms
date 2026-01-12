import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Eye, Edit, Share, CheckCircle, XCircle, Clock, Shield, X, Maximize2 } from 'lucide-react';

export default function AccessLogList({ userId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (!userId) return;

        setLoading(true);
        api(`/api/access-logs/user/${userId}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch logs");
                return res.json();
            })
            .then(data => {
                // The backend returns { success: true, data: [...] }
                setLogs(data.data || []);
                setError(null);
            })
            .catch(err => {
                console.error("Error fetching logs:", err);
                setError("Could not load access history.");
            })
            .finally(() => setLoading(false));
    }, [userId]);

    const getActionIcon = (action) => {
        switch (action) {
            case 'VIEW': return <Eye size={16} className="text-blue-500" />;
            case 'EDIT': return <Edit size={16} className="text-amber-500" />;
            case 'SHARE': return <Share size={16} className="text-green-500" />;
            default: return <Clock size={16} className="text-gray-400" />;
        }
    };

    const getResultIcon = (result) => {
        return result === 'ALLOWED'
            ? <CheckCircle size={14} className="text-green-600" />
            : <XCircle size={14} className="text-red-500" />;
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: 'numeric', hour12: true
            });
        } catch (e) {
            return dateString;
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-500 animate-pulse">Loading access history...</div>;
    }

    if (error) {
        return <div className="p-4 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>;
    }

    if (logs.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Shield className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No access history found.</p>
            </div>
        );
    }

    const logsToShow = logs.slice(0, 5);

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Shield size={18} className="text-yellow-600" />
                    Access History
                </h2>

                {logs.length > 5 && (
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="text-xs text-yellow-700 hover:text-yellow-900 font-medium flex items-center gap-1"
                    >
                        View All ({logs.length}) <Maximize2 size={12} />
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {logsToShow.map((log) => (
                    <LogCard key={log.log_id} log={log} getActionIcon={getActionIcon} getResultIcon={getResultIcon} formatDate={formatDate} />
                ))}
            </div>

            {logs.length > 5 && (
                <div className="mt-2 text-center">
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        + {logs.length - 5} more records
                    </button>
                </div>
            )}

            {/* Full History Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Full Access History</h2>
                                <p className="text-xs text-gray-500">Showing all {logs.length} records</p>
                            </div>
                            <button onClick={() => setIsDialogOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-1 hover:bg-gray-200 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/50">
                            {logs.map((log) => (
                                <LogCard key={log.log_id} log={log} getActionIcon={getActionIcon} getResultIcon={getResultIcon} formatDate={formatDate} detailed />
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white text-right">
                            <button
                                onClick={() => setIsDialogOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LogCard({ log, getActionIcon, getResultIcon, formatDate, detailed = false }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">

            <div className="flex items-start justify-between pl-3">
                <div className="flex gap-3">
                    <div className={`mt-1 p-2 rounded-lg ${log.action === 'VIEW' ? 'bg-blue-50' : log.action === 'EDIT' ? 'bg-amber-50' : 'bg-green-50'}`}>
                        {getActionIcon(log.action)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-800 text-sm">
                                {log.healthcare_worker?.first_name
                                    ? `Dr. ${log.healthcare_worker.first_name} ${log.healthcare_worker.last_name || ''}`
                                    : log.healthcare_worker?.job_title
                                        ? `${log.healthcare_worker.job_title}`
                                        : log.healthcare_worker?.user?.email || 'Unknown Staff'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
                                {log.healthcare_worker?.healthcare_facility?.name || 'Unknown Facility'}
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
                            {formatDate(log.timestamp)}
                        </p>

                        {detailed && (
                            <div className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-semibold text-gray-700">Reason:</span> {log.reason}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${log.result === 'ALLOWED'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                        {getResultIcon(log.result)}
                        {log.result}
                    </div>
                </div>
            </div>
        </div>
    );
}
