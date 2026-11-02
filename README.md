# Melbourne Emergency Watch — prototype

A responsive installable-web-app prototype for community hazard reports in Melbourne and Brevard County, Florida.

## Run locally

Because map tiles, Leaflet, and service-worker registration need a web origin, serve this folder with a local static server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Internet access is needed for the OpenStreetMap tiles and Leaflet CDN in this prototype.

## Included now
- Responsive map centered on Melbourne, Florida, with Brevard-area coordinate bounds
- Flooding, fire/smoke, storm damage, road hazard, power outage, and other categories
- Tap map to set report coordinates; optional browser geolocation
- Anonymous or display-name reporting
- Optional photo upload (2 MB limit)
- Local report list, category filters, and map popups
- Basic PWA manifest, icon, and service-worker shell cache
- Safety notice distinguishing community reports from official emergency alerts

## Important prototype limitations
- Reports are saved only in the submitting browser's local storage. They are **not** shared with other users.
- There is no real user registration, authentication, cloud database, photo hosting, moderation, report verification, push notifications, or admin console yet.
- Two map pins are explicitly labeled demo/sample markers, not live incidents.
- This is not an emergency dispatch or official alert service. Call 911 for immediate danger and follow official instructions.

## Production work still required
1. Create a Supabase project and configure database, row-level security, storage, and authentication (including guest/anonymous submissions).
2. Replace local storage with shared database reads/writes and real-time subscriptions.
3. Add moderation, abuse prevention, rate limits, duplicate detection, report expiry, and audit logs.
4. Add photo upload with privacy controls and content review.
5. Add trusted official alert feeds and clear source labels; never imply community reports are official.
6. Add push notification infrastructure and opt-in geofencing.
7. Build native Android/iOS packages with Expo and test permissions, accessibility, and store requirements.

Map data © OpenStreetMap contributors. Leaflet is loaded from its public CDN.
