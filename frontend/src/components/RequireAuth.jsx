import { Navigate, Outlet, useLocation } from "react-router-dom";
import NotFound from "../pages/NotFound";

export default function RequireAuth({ allowedRoles }) {
  const location = useLocation();

  // Helper to get token/user from either storage
  const getTokenData = () => {
    const access =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const userStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error("Failed to parse user", e);
    }
    return { access, user };
  };

  const { access, user } = getTokenData();

  // 1. No token -> Redirect to Login
  if (!access) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Token exists, but role is not allowed -> Show 404
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <NotFound />;
  }

  // 3. Authorized -> Render children
  return <Outlet />;
}
