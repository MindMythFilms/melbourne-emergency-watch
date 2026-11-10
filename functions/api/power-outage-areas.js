export async function onRequestGet({ request, env, waitUntil }) {
  const cors = {
    "Access-Control-Allow-Origin": "https://coastwatch-fl.pages.dev",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept",
    "Vary": "Origin"
  };
  const error = (message, status) => new Response(JSON.stringify({ error: message }), {
    status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
  if (!env.MASSOUTAGE_API_KEY) return error("Power outage area service is not configured.", 503);
  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/power-outage-areas", request.url).toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  try {
    const upstream = await fetch("https://massoutage.com/api/v1/live/counties/12009/areas?format=geojson&active=true", {
      headers: { "Accept": "application/geo+json, application/json", "Authorization": "Bearer " + env.MASSOUTAGE_API_KEY }
    });
    const body = await upstream.text();
    const headers = new Headers({
      ...cors,
      "Content-Type": upstream.headers.get("Content-Type") || "application/geo+json",
      "Cache-Control": upstream.ok ? "public, max-age=60, s-maxage=300" : "no-store",
      "X-Data-Source": "MassOutage"
    });
    for (const name of ["Retry-After", "X-Request-Id", "X-API-Version", "X-Data-Notice"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = new Response(body, { status: upstream.status, headers });
    if (upstream.ok) waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (e) {
    return error("Unable to retrieve outage-area data right now.", 502);
  }
}
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "https://coastwatch-fl.pages.dev",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept",
    "Access-Control-Max-Age": "86400"
  }});
}