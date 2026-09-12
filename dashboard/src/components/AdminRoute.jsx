import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRoute = () => {
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fog">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (authUser.role !== "Admin") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
