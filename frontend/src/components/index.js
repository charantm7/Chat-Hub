import { jwtDecode } from "jwt-decode";

export function isAccessTokenExpired() {
  const expiry = localStorage.getItem("accessExpiry");
  return !expiry || Date.now() > Number(expiry);
}

export async function refreshAccessToken() {
  try {
    const res = await fetch("http://127.0.0.1:8000/v1/auth/refresh", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Refresh Failed");

    const data = await res.json();
    const decoded = jwtDecode(data.access_token);

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("accessExpiry", (decoded.exp * 1000).toString());

    return data.access_token;
  } catch (err) {
    console.error("Token refresh error:", err);
    return null;
  }
}

export async function logout() {
  try {
    const req = await fetch("http://127.0.0.1:8000/v1/auth/logout", {
      method: "GET",
      credentials: "include",
    });

    if (!req.ok) throw new Error("Logout Failed");
    const data = req.json();
    console.log(data);
  } catch (e) {
    console.warn("Logout Failed");
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("accessExpiry");
    window.location.replace("/");
  }
}

export async function GetValidAccessToken() {
  if (isAccessTokenExpired()) {
    console.log("expired");
    return await refreshAccessToken();
  }
  console.log("not expired");
  return localStorage.getItem("token");
}

export async function GetAllUsers() {
  const token = await GetValidAccessToken();
  if (!token) return null;
  try {
    const res = await fetch("http://127.0.0.1:8000/v1/user/get-users", {
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
