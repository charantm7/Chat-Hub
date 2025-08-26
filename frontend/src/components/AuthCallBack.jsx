import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Notification permission granted.");
      }
    });
  }
}

function AuthCallBack() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (token && refresh) {
      const access_decode = jwtDecode(token);
      const refresh_decode = jwtDecode(refresh);
      const accessExpiry = new Date(access_decode.exp * 1000);
      const refreshExpiry = new Date(refresh_decode.exp * 1000);
      localStorage.setItem("token", token);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("accessExpiry", accessExpiry);
      localStorage.setItem("refreshExpiry", refreshExpiry);
      requestNotificationPermission();
      setTimeout(() => navigate("/chat", { replace: true }), 0);
    } else {
      console.error("No token found in URL");
      navigate("/authentication");
    }
  }, [navigate]);
  return <div>Logging in...</div>;
}

export default AuthCallBack;
