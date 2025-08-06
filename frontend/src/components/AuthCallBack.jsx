import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AuthCallBack() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (token && refresh) {
      const accessExpiry = Date.now() + 1 * 60 * 1000;
      const refreshExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem("token", token);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("accessExpiry", accessExpiry);
      localStorage.setItem("refreshExpiry", refreshExpiry);

      setTimeout(() => navigate("/chat", { replace: true }), 0);
    } else {
      console.error("No token found in URL");
      navigate("/authentication");
    }
  }, [navigate]);
  return <div>Logging in...</div>;
}

export default AuthCallBack;
