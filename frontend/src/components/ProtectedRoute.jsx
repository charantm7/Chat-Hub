import { Navigate } from "react-router-dom";
import React from "react";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/authentication" />;
}

export default ProtectedRoute;
