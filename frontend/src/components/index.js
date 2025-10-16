import { jwtDecode } from "jwt-decode";

export function isAccessTokenExpired() {
  const expiry = localStorage.getItem("accessExpiry");
  return !expiry || Date.now() * 1000 > parseInt(expiry);
}

export function isRefreshTokenExpired() {
  const expiry = localStorage.getItem("refreshExpiry");
  return !expiry || Date.now() * 1000 > parseInt(expiry);
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh || isRefreshTokenExpired()) {
    return null;
  }

  try {
    const res = await fetch("http://https://a3bde5c1549d.ngrok-free.app/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refresh }),
    });
    if (!res.ok) throw new Error("Refresh Failed");
    const data = await res.json();
    if (data) {
      const access_decode = jwtDecode(data.access_token);

      const accessExpiry = access_decode.exp * 1000;
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("accessExpiry", accessExpiry);
    }
    console.log("refresh", data.access_token);
    return data.access_token;
  } catch (err) {
    console.error("Token refresh error:", err);
    logout();
    return null;
  }
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("accessExpiry");
  localStorage.removeItem("refreshExpiry");
  window.location.href = "/";
}

export async function GetValidAccessToken() {
  if (isAccessTokenExpired()) {
    return await refreshAccessToken();
  }
  console.log("not expired");
  return localStorage.getItem("token");
}

export async function GetAllUsers() {
  const token = await GetValidAccessToken();
  if (!token) return null;
  try {
    const res = await fetch("http://https://a3bde5c1549d.ngrok-free.app/v1/auth/get-users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Fetching user failed");

    return await res.json();
  } catch (error) {
    console.error("Error fetching users", error);
    return null;
  }
}
