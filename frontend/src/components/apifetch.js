export async function apifetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    switch (res.status) {
      case 403:
        window.location.href = "/accessdenied";
        break;

      case 404:
        window.location.href = "/notfound";

      default:
        window.location.href = "/error";
    }
    throw new Error("API Error");
  }
  return res.json();
}
