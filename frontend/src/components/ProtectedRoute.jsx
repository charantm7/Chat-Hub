import { Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { GetValidAccessToken } from "./index";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const token = await GetValidAccessToken();
      setIsAuthenticated(!!token);
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // You can show a spinner here
  }

  return isAuthenticated ? children : <Navigate to="/" />;
}

export default ProtectedRoute;
