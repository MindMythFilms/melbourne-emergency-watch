export async function onRequestGet({ request, env, waitUntil }) {
  const cors = {
    "Access-Control-Allow-Origin": "https://coastwatch-fl.pages.dev",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept",
    "Vary": "Origin"
  };
  const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": status === 200 ? "public, max-age=60, s-maxage=300" : "no-store", ...extra }
  });
  if (!env.MASSOUTAGE_API_KEY) return json({ error: "Power outage service is not configured." }, 503);

  const cache = caches.default;
  const cacheKey = new Request(new URL("/api/power-outages", request.url).toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("X-CoastWatch-Cache", "HIT");
    return new Response(cached.body, { status: cached.status, headers });
  }

  const base = "https://massoutage.com/api/v1/live/counties/12009";
  const headers = {
    "Accept": "application/json, application/geo+json",
    "Authorization": "Bearer " + env.MASSOUTAGE_API_KEY
  };
  try {
    const [countyResponse, incidentsResponse, areasResponse] = await Promise.all([
      fetch(base, { headers }),
      fetch(base + "/incidents?format=geojson", { headers }),
      fetch(base + "/areas?format=geojson&active=true", { headers })
    ]);
    const responses = [countyResponse, incidentsResponse, areasResponse];
    const failed = responses.find(r => !r.ok);
    if (failed) {
      const extra = {};
      for (const name of ["Retry-After", "X-Request-Id", "X-API-Version", "X-Data-Notice"]) {
        const value = failed.headers.get(name);
        if (value) extra[name] = value;
      }
      return json({ error: "MassOutage could not return all Brevard outage datasets.", upstream_status: failed.status }, failed.status, extra);
    }
    const [county, incidents, areas] = await Promise.all(responses.map(r => r.json()));
    const payload = {
      county,
      incidents,
      areas,
      meta: {
        live: county.meta?.live || incidents.meta?.live || areas.meta?.live || null,
        notice: incidents.meta?.notice || areas.meta?.notice || null,
        sources: incidents.meta?.sources || county.meta?.sources || [],
        fetched_at: new Date().toISOString()
      }
    };
    const response = json(payload, 200, { "X-Data-Source": "MassOutage" });
    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    return json({ error: "Unable to retrieve power outage data right now." }, 502);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://coastwatch-fl.pages.dev",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept",
      "Access-Control-Max-Age": "86400"
    }
  });
}
