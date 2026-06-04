const API_URL = import.meta.env.VITE_API_URL || "/api";

export function resolveMediaUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const mediaUrl = new URL(url, window.location.origin);
    const apiUrl = new URL(API_URL, window.location.origin);

    if (mediaUrl.hostname === "localhost" && window.location.hostname !== "localhost") {
      return `${window.location.origin}${mediaUrl.pathname}${mediaUrl.search}`;
    }

    if (url.startsWith("/api") && apiUrl.origin !== window.location.origin) {
      return `${apiUrl.origin}${url}`;
    }

    return mediaUrl.href;
  } catch (_error) {
    return url;
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("terrabiocol_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(body?.message || "No fue posible completar la solicitud");
  }

  return body;
}
