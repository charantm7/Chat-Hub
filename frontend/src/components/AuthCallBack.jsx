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

    if (!token) {
      console.error("No token found in URL");
      navigate("/authentication");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      const accessExpiry = decoded.exp * 1000;

      localStorage.setItem("token", token);
      localStorage.setItem("accessExpiry", accessExpiry.toString());

      requestNotificationPermission();
      setTimeout(() => navigate("/chat", { replace: true }), 0);
    } catch (err) {
      console.error("Invalid access token", err);
      navigate("/authentication");
    }
  }, [navigate]);

  return <div>Logging in...</div>;
}

export default AuthCallBack;
