export function isAccessTokenExpired() {
  const expiry = localStorage.getItem("accessExpiry");
  return !expiry || Date.now() > parseInt(expiry);
}

export function isRefreshTokenExpired() {
  const expiry = localStorage.getItem("refreshExpiry");
  return !expiry || Date.now() > parseInt(expiry);
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh || isRefreshTokenExpired()) {
    return null;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refresh }),
    });
    if (!res.ok) throw new Error("Refresh Failed");
    const data = await res.json();
    const accessExpiry = Date.now() + 60 * 60 * 1000;

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("accessExpiry", accessExpiry);

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
  return localStorage.getItem("token");
}

export async function GetAllUsers() {
  const token = await GetValidAccessToken();
  if (!token) return null;
  try {
    const res = await fetch("http://127.0.0.1:8000/v1/auth/get-users", {
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
