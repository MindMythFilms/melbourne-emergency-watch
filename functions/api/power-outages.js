export async function onRequestGet({ request, env, waitUntil }) {
  const cors = {
    "Access-Control-Allow-Origin": "https://coastwatch-fl.pages.dev",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept",
    "Access-Control-Expose-Headers": "X-CoastWatch-Fetched-At, X-CoastWatch-Cache, X-Data-Source, X-Data-Notice, Retry-After",
    "Vary": "Origin"
  };
  const jsonError = (message, status) => new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
  if (!env.MASSOUTAGE_API_KEY) return jsonError("Power outage service is not configured.", 503);
  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/power-outages", request.url).toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("X-CoastWatch-Cache", "HIT");
    return new Response(cached.body, { status: cached.status, headers });
  }
  try {
    const upstream = await fetch("https://massoutage.com/api/v1/live/counties/12009/incidents?format=geojson", {
      headers: { "Accept": "application/geo+json, application/json", "Authorization": "Bearer " + env.MASSOUTAGE_API_KEY }
    });
    const body = await upstream.text();
    const headers = new Headers({
      ...cors,
      "Content-Type": upstream.headers.get("Content-Type") || "application/geo+json",
      "Cache-Control": upstream.ok ? "public, max-age=60, s-maxage=300" : "no-store",
      "X-Data-Source": "MassOutage",
      "X-CoastWatch-Fetched-At": new Date().toISOString(),
      "X-CoastWatch-Cache": "MISS"
    });
    for (const name of ["Retry-After", "X-Request-Id", "X-API-Version", "X-Data-Notice"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = new Response(body, { status: upstream.status, headers });
    if (upstream.ok) waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return jsonError("Unable to retrieve power outage data right now.", 502);
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