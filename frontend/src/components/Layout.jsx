import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import UserInfoBanner from "./UserInfoBanner";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthRoute =
    location.pathname === "/" || location.pathname === "/signup";
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isAuthRoute) {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");

      if (!token) {
        navigate("/");
      } else if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      }
    } else {
      setUser(null);
    }
  }, [isAuthRoute, navigate]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");

    setUser(null);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-yellow-50 text-yellow-900">
      {!isAuthRoute && (
        <>
          <header className="bg-yellow-200 border-b border-yellow-300">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
              <nav className="flex gap-4">
                <a
                  href="/healthcare-worker"
                  className="text-sm font-medium text-yellow-900 hover:text-yellow-700"
                >
                  Dashboard
                </a>
                {user?.role === "healthcare_worker" && (
                  <a
                    href="/healthcare-worker/consents"
                    className="text-sm font-medium text-yellow-900 hover:text-yellow-700"
                  >
                    Consents
                  </a>
                )}
              </nav>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </header>
          <UserInfoBanner user={user} />
        </>
      )}

      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
