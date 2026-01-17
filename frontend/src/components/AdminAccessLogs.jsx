import { useState, useEffect } from "react";
import { api } from "../utils/api";
import {
  Shield,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Download,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function AdminAccessLogs() {
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("7days"); // 24h, 7days, 30days, all
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Limits
  const INITIAL_LIMIT = 7;

  const fetchLogs = () => {
    setLoading(true);
    api("/api/admin/access-logs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch system logs");
        return res.json();
      })
      .then((data) => {
        // Determine data structure (array or {data: []})
        const logs = Array.isArray(data) ? data : data.data || [];
        setAllLogs(logs);
        setError(null);
      })
      .catch((err) => {
        console.error("Admin Log Fetch Error:", err);
        setError("Could not retrieve system access logs.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...allLogs];

    // 1. Time Range Filter
    if (timeRange !== "all") {
      const cutoff = new Date();
      if (timeRange === "24h") cutoff.setHours(cutoff.getHours() - 24);
      if (timeRange === "7days") cutoff.setDate(cutoff.getDate() - 7);
      if (timeRange === "30days") cutoff.setDate(cutoff.getDate() - 30);

      result = result.filter((log) => new Date(log.timestamp) >= cutoff);
    }

    // 2. Search Filter (Patient Name or Worker ID/Job)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((log) => {
        const patientName =
          `${log.patient?.first_name} ${log.patient?.last_name}`.toLowerCase();
        const workerInfo =
          `${log.healthcare_worker?.job_title} ${log.healthcare_worker?.license_number}`.toLowerCase();
        const facility =
          log.healthcare_worker?.healthcare_facility?.name?.toLowerCase();
        return (
          patientName.includes(q) ||
          workerInfo.includes(q) ||
          (facility && facility.includes(q))
        );
      });
    }

    setFilteredLogs(result);
  }, [allLogs, timeRange, searchQuery]);

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Timestamp,Patient,Worker Job,Facility,Action,Result\n" +
      filteredLogs
        .map(
          (log) =>
            `${log.log_id},${log.timestamp},${log.patient?.first_name} ${log.patient?.last_name},${log.healthcare_worker?.job_title},${log.healthcare_worker?.healthcare_facility?.name},${log.action},${log.result}`,
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "access_logs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayLogs = expanded
    ? filteredLogs
    : filteredLogs.slice(0, INITIAL_LIMIT);

  if (loading && allLogs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading system logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
        <AlertTriangle size={20} />
        {error}
        <button
          onClick={fetchLogs}
          className="ml-auto text-sm underline hover:text-red-900"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header / Controls */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Shield className="text-yellow-600" size={20} />
              System Access Logs
            </h2>
            <p className="text-sm text-gray-500">
              Monitor all data access attempts across the platform.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <Download size={16} /> Export
            </button>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition shadow-sm"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by patient, worker, or facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
            />
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
            {["24h", "7days", "30days", "all"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeRange === range
                    ? "bg-yellow-100 text-yellow-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {range === "24h"
                  ? "24H"
                  : range === "7days"
                    ? "7 Days"
                    : range === "30days"
                      ? "30 Days"
                      : "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 w-10"></th>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Accessed By</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Result</th>
              <th className="px-5 py-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayLogs.length > 0 ? (
              displayLogs.map((log) => (
                <tr
                  key={log.log_id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-5 py-3">
                    <div
                      className={`w-2 h-2 rounded-full ${log.result === "ALLOWED" ? "bg-green-500" : "bg-red-500"}`}
                    />
                  </td>
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {log.patient?.first_name} {log.patient?.last_name}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">
                        {log.healthcare_worker?.job_title || "Worker"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {log.healthcare_worker?.healthcare_facility?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold capitalize
                                            ${
                                              log.action === "VIEW"
                                                ? "bg-blue-100 text-blue-700"
                                                : log.action === "EDIT"
                                                  ? "bg-amber-100 text-amber-700"
                                                  : "bg-green-100 text-green-700"
                                            }`}
                    >
                      {log.action?.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {log.result === "ALLOWED" ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100">
                        <CheckCircle size={12} /> Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-medium border border-red-100">
                        <XCircle size={12} /> Denied
                      </span>
                    )}
                  </td>
                  <td
                    className="px-5 py-3 text-gray-500 max-w-[200px] truncate"
                    title={log.reason}
                  >
                    {log.reason}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-5 py-12 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter size={24} className="opacity-20" />
                    <p>No logs found matching your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm">
        <span className="text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-900">
            {Math.min(displayLogs.length, filteredLogs.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-gray-900">
            {filteredLogs.length}
          </span>{" "}
          logs
          {allLogs.length !== filteredLogs.length && (
            <span className="text-xs ml-1">
              (filtered from {allLogs.length})
            </span>
          )}
        </span>

        {filteredLogs.length > INITIAL_LIMIT && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-yellow-600 hover:text-yellow-800 font-medium hover:underline transition"
          >
            {expanded ? "Show Less" : `Show All (${filteredLogs.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
