import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AuthCallBack() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      console.info("This is token recived", token);
      localStorage.setItem("token", token);
      setTimeout(() => navigate("/chat", { replace: true }), 0);
    } else {
      console.error("No token found in URL");
      navigate("/authentication");
    }
  }, [navigate]);
  return <div>Logging in...</div>;
}

export default AuthCallBack;
