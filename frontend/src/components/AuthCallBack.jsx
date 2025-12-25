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

    if (token) {
      const access_decode = jwtDecode(token);
      const accessExpiry = new Date(access_decode.exp * 1000);
      localStorage.setItem("token", token);
      localStorage.setItem("accessExpiry", accessExpiry);
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
