import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function Signup() {
  const [role, setRole] = useState("PATIENT"); // PATIENT or HEALTHCARE_WORKER
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationalId, setNationalId] = useState("");

  // Healthcare Worker fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [facilityName, setFacilityName] = useState("");

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch facilities for the dropdown
    async function fetchFacilities() {
      try {
        const res = await api("/facilities");
        if (res.ok) {
          const data = await res.json();
          setFacilities(data);
        }
      } catch (err) {
        console.error("Failed to fetch facilities", err);
      }
    }
    fetchFacilities();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic Validation
    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    if (role === "PATIENT" && !nationalId) {
      setError("National ID is required for patients");
      setLoading(false);
      return;
    }

    if (role === "HEALTHCARE_WORKER") {
      if (!licenseNumber || !jobTitle || !facilityName) {
        setError("All fields are required for healthcare workers");
        setLoading(false);
        return;
      }
    }

    const payload = {
      email,
      password,
      role,
    };

    if (role === "PATIENT") {
      payload.national_id = nationalId;
    } else {
      payload.license_number = licenseNumber;
      payload.job_title = jobTitle;
      payload.facility_name = facilityName;
    }

    try {
      const res = await api("/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body?.message || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto Login
      try {
        const loginRes = await api("/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        const loginBody = await loginRes.json();

        if (!loginRes.ok || !loginBody.success) {
          navigate("/");
          return;
        }

        const { access_token, refresh_token, user } = loginBody.data;

        sessionStorage.setItem("access_token", access_token);
        sessionStorage.setItem("refresh_token", refresh_token);
        sessionStorage.setItem("user", JSON.stringify(user));

        if (user.role === "admin") navigate("/admin");
        else if (user.role === "patient") navigate("/patient");
        else if (user.role === "healthcare_worker")
          navigate("/healthcare-worker");
        else navigate("/patient");
      } catch (loginErr) {
        console.error("Auto-login failed", loginErr);
        navigate("/");
      }
    } catch {
      setError("Network error during registration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-gray-50/50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Create Account
          </h1>
          <p className="text-sm text-slate-500">Join Health Hub today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Role Toggle */}
        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setRole("PATIENT")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              role === "PATIENT"
                ? "bg-white text-yellow-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole("HEALTHCARE_WORKER")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              role === "HEALTHCARE_WORKER"
                ? "bg-white text-yellow-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Healthcare Worker
          </button>
        </div>

        {/* Common Fields */}
        <div className="space-y-4 mb-6">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 py-2.5 px-3"
              placeholder="name@example.com"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 py-2.5 px-3"
              placeholder="••••••••"
            />
          </label>
        </div>

        {/* Patient Specific */}
        {role === "PATIENT" && (
          <div className="space-y-4 mb-6 animate-in slide-in-from-top-2 duration-300">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">
                National ID
              </span>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 py-2.5 px-3"
                placeholder="Enter National ID"
              />
            </label>
          </div>
        )}

        {/* Healthcare Worker Specific */}
        {role === "HEALTHCARE_WORKER" && (
          <div className="space-y-4 mb-6 animate-in slide-in-from-top-2 duration-300">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">
                License Number
              </span>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 py-2.5 px-3"
                placeholder="Medical License Number"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">
                Job Title
              </span>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 py-2.5 px-3"
                placeholder="e.g. Doctor, Nurse"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">
                Facility
              </span>
              <select
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 py-2.5 px-3"
              >
                <option value="">Select a facility</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600 transition-colors ${
            loading ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <a
              href="/"
              className="font-medium text-yellow-700 hover:text-yellow-800 hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
