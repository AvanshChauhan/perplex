import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-900 font-bold text-xl tracking-wider">Perplex</span>
          <span className="text-slate-400 text-sm font-medium">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-900 font-bold text-xl tracking-wider">Perplex</span>
          <span className="text-slate-400 text-sm font-medium">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
