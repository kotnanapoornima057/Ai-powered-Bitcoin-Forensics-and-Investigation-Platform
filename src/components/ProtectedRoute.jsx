import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function ProtectedRoute({ children }) {
  const {
    user,
    loading,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="auth-spinner" />
        <span>Loading investigation console...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;