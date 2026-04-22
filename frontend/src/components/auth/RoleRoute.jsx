import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../store/authStore";

export default function RoleRoute({ roles }) {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    const redirectMap = {
      admin: "/admin/dashboard",
      property_owner: "/owner/dashboard",
      investor: "/dashboard",
    };
    return <Navigate to={redirectMap[user.role] || "/"} replace />;
  }

  return <Outlet />;
}
