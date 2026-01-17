import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body?.message || "Login failed");
        setLoading(false);
        return;
      }

      const { access_token, refresh_token, user } = body.data;

      // Store tokens based on remember me preference
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("access_token", access_token);
      storage.setItem("refresh_token", refresh_token);
      storage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      const role = user?.role;
      if (role === "admin") navigate("/admin");
      else if (role === "patient") navigate("/patient");
      else if (role === "healthcare_worker") navigate("/healthcare-worker");
      else navigate("/patient");
    } catch {
      setError("Network error");
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
            Welcome Back
          </h1>
          <p className="text-sm text-slate-500">
            Please enter your details to sign in
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <label className="block mb-5">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 py-2.5 px-3 transition-colors"
            placeholder="name@example.com"
          />
        </label>

        <label className="block mb-6">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 py-2.5 px-3 transition-colors"
            placeholder="••••••••"
          />
        </label>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-600 border-gray-300 rounded cursor-pointer"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-slate-600 cursor-pointer"
            >
              Remember me
            </label>
          </div>
          <a
            href="/forgot-password"
            className="text-sm font-medium text-yellow-700 hover:text-yellow-800 hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600 transition-colors ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-yellow-700 hover:text-yellow-800 hover:underline"
            >
              Sign up for free
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
