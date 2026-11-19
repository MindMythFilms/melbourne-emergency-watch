
window.mewDeclineConsent=function(){const overlay=document.getElementById("consentOverlay");overlay.innerHTML='<div class="dialog"><h2>No problem</h2><p>You chose not to accept the terms, so the site will remain unavailable. You can close this page.</p></div>';};
window.mewAcceptConsent=async function(){
 const accept=document.getElementById("acceptBtn"),error=document.getElementById("consentError");error.classList.add("hidden");
 if(!document.getElementById("termsCheck").checked){error.textContent="Please check the agreement box before continuing.";error.classList.remove("hidden");return;}
 accept.disabled=true;accept.textContent="Saving…";
 const version="coastwatch-fl-terms-2026-11-03-v2",key="sb_publishable_Lg56W-Uj-4-_CcQHBLguDg_trvtoqIO",url="https://lqzxzlaxvfjuklyzxbex.supabase.co";
 let sid=localStorage.getItem("mew_browser_session")||sessionStorage.getItem("mew_browser_session");if(!sid){sid=crypto.randomUUID?crypto.randomUUID():String(Date.now())+"-"+Math.random();}localStorage.setItem("mew_browser_session",sid);
 try{const response=await fetch(url+"/rest/v1/rpc/record_mew_terms_acceptance",{method:"POST",headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({p_terms_version:version,p_browser_session_id:sid,p_age_attested:false})});if(!response.ok)throw new Error("HTTP "+response.status);localStorage.setItem("mew_accepted_version",version);sessionStorage.setItem("mew_accepted_version",version);document.getElementById("consentOverlay").remove();}
 catch(e){error.textContent="We couldn't save your agreement. Please try again.";error.classList.remove("hidden");accept.disabled=false;accept.textContent="I agree — continue";}
};
(()=>{const version="coastwatch-fl-terms-2026-11-03-v2";const previouslyAccepted=localStorage.getItem("mew_accepted_version")||sessionStorage.getItem("mew_accepted_version");if(previouslyAccepted===version){localStorage.setItem("mew_accepted_version",version);document.getElementById("consentOverlay").remove();}})();

;

const SUPABASE_URL="https://lqzxzlaxvfjuklyzxbex.supabase.co",SUPABASE_KEY="sb_publishable_Lg56W-Uj-4-_CcQHBLguDg_trvtoqIO",TERMS_VERSION="coastwatch-fl-terms-2026-11-03-v2";
// browser login token. Public reads/submissions remain governed by the existing RLS policies.
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const themeButton=document.getElementById("themeToggle");
function applyTheme(theme){document.body.classList.toggle("dark",theme==="dark");themeButton.textContent=theme==="dark"?"☀️ Light mode":"🌙 Dark mode";themeButton.setAttribute("aria-pressed",String(theme==="dark"));}
applyTheme(localStorage.getItem("mew-theme")||"dark");
themeButton.addEventListener("click",()=>{const next=document.body.classList.contains("dark")?"light":"dark";localStorage.setItem("mew-theme",next);applyTheme(next);});

const categories=["flooding","coastal_flooding","storm_damage","tornado_damage","fire","road_hazard","road_closure","power_outage","erosion_washout","other_hazard"];
const $=id=>document.getElementById(id);

const mewReportPanel=document.getElementById("report-panel"),mewMapPanel=document.getElementById("map-panel"),mewMapElement=document.getElementById("map"),mewReportPlaceholder=document.getElementById("mewMobileReportPlacement"),mewMain=document.querySelector("main"),mewHero=document.querySelector(".hero-visual"),mewLayout=document.querySelector(".layout"),mewMobileLayout=window.matchMedia("(max-width:650px)");
function mewPlaceReportPanel(){if(!mewReportPanel||!mewMapPanel||!mewMapElement||!mewMain)return;mewMain.appendChild(mewReportPanel);}
function mewPlaceHero(){if(!mewHero||!mewMapPanel||!mewLayout)return;if(mewMobileLayout.matches){mewLayout.insertBefore(mewHero,mewMapPanel);}else{mewLayout.insertAdjacentElement("beforebegin",mewHero);}}
mewPlaceReportPanel();mewPlaceHero();if(mewMobileLayout.addEventListener)mewMobileLayout.addEventListener("change",()=>{mewPlaceReportPanel();mewPlaceHero();setTimeout(()=>map.invalidateSize({pan:false}),150);});else mewMobileLayout.addListener(()=>{mewPlaceReportPanel();mewPlaceHero();setTimeout(()=>map.invalidateSize({pan:false}),150);});

const mobileLegendButton=$("mobileLegendToggle"),mobileLegend=$("nwsLegend");if(mobileLegendButton&&mobileLegend){mobileLegend.classList.add("mobile-collapsed");mobileLegendButton.addEventListener("click",()=>{const expanded=mobileLegendButton.getAttribute("aria-expanded")==="true";mobileLegend.classList.toggle("mobile-collapsed",expanded);mobileLegendButton.setAttribute("aria-expanded",String(!expanded));mobileLegendButton.textContent=expanded?"＋ Map legend":"－ Hide map legend";});}
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function message(text,kind=""){const e=$("formMessage");e.textContent=text;e.className="status "+kind}
let map=L.map("map",{scrollWheelZoom:false,dragging:false,touchZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,fadeAnimation:false,markerZoomAnimation:false,preferCanvas:true}).setView([28.0836,-80.6081],11),markers=[],photoBubbleMarkers=[];
let mewNearbyLocation=null;
function mewUpdateNearbyStatus(){
 const target=document.querySelector('#mew-emergency-status-strip [data-status="nearby"] strong');
 if(!target)return;
 if(!mewNearbyLocation){target.textContent="Tap My Location";return}
 const reports=Array.isArray(window.mewReports)?window.mewReports:[];
 const nearby=reports.filter(r=>Number.isFinite(+r.latitude)&&Number.isFinite(+r.longitude)&&mewNearbyLocation.distanceTo(L.latLng(+r.latitude,+r.longitude))<=16093.44);
 target.textContent=nearby.length+" nearby";
 target.title=nearby.length+" community reports within 10 miles. Wider county map remains visible.";
}
/* Mobile map gestures: one finger scrolls the page; two fingers pan/zoom the map. */
const mewMapContainer=map.getContainer();
const mewMobileMapGestures=window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
let mewMapUnlocked=false;
function mewUnlockMap(event){
 if(mewMobileMapGestures){
  // Never enable one-finger dragging on touch devices. Leaflet's touchZoom
  // handler takes over when a second finger is placed on the map.
  map.dragging.disable();
  map.touchZoom.enable();
  map.doubleClickZoom.enable();
  map.boxZoom.disable();
  map.keyboard.enable();
  map.scrollWheelZoom.disable();
  mewMapUnlocked=true;
 }else{
  if(mewMapUnlocked)return;
  mewMapUnlocked=true;
  map.dragging.enable();
  map.touchZoom.enable();
  map.doubleClickZoom.enable();
  map.boxZoom.enable();
  map.keyboard.enable();
  map.scrollWheelZoom.enable();
 }
 const hint=document.getElementById("mapInteractionHint");
 if(hint)hint.remove();
}
if(mewMobileMapGestures){
 map.dragging.disable();
 map.touchZoom.enable();
 map.scrollWheelZoom.disable();
 mewMapContainer.style.touchAction="pan-y";
}else{
 mewMapContainer.addEventListener("pointerdown",event=>{if(event.pointerType!=="touch")mewUnlockMap(event);},{capture:true,once:true});
 mewMapContainer.addEventListener("focusin",mewUnlockMap,{once:true});
}
requestAnimationFrame(()=>requestAnimationFrame(()=>map.invalidateSize({pan:false})));
const mewMapStage=document.querySelector(".map-stage");
map.on("popupopen",()=>mewMapStage?.classList.add("mew-popup-visible"));
map.on("popupclose",()=>mewMapStage?.classList.remove("mew-popup-visible"));
// COASTWATCH_NWS_ALERTS_V2 — isolated official-alert overlay; never modifies community report loading.
const nwsAlertLayer=L.featureGroup().addTo(map);
const powerOutageLayer=L.featureGroup().addTo(map);
const powerOutageAreaLayer=L.featureGroup();
const usgsWaterLayer=L.featureGroup().addTo(map);
const noaaTideLayer=L.featureGroup().addTo(map);
let noaaTideFetchInProgress=false;
const evacuationZoneLayer=L.featureGroup();
map.createPane("mewShelterPane");map.getPane("mewShelterPane").style.zIndex="450";
const shelterLayer=L.featureGroup();
let shelterFetchInProgress=false;
let mewShelterItems=[];
function mewMakeCountCluster(count,latlng,bounds,kind,color){
 const safeColor=/^#[0-9a-f]{6}$/i.test(String(color||""))?String(color):"#174f78";
 const icon=L.divIcon({className:"mew-count-cluster mew-"+kind+"-cluster",html:'<span style="background:'+safeColor+';outline-color:'+safeColor+'">'+count+'</span>',iconSize:[48,48],iconAnchor:[24,24]});
 const marker=L.marker(latlng,{icon,keyboard:true,title:count+" "+kind+" locations"});
 marker.on("click",()=>{if(bounds&&bounds.isValid())map.fitBounds(bounds,{padding:[55,55],maxZoom:Math.min(16,map.getZoom()+3),animate:true});});
 return marker;
}
function mewGroupNearby(items,radius){
 const groups=[];
 items.forEach(item=>{
  const point=map.latLngToContainerPoint(item.latlng);
  let group=groups.find(g=>g.points.some(p=>Math.hypot(p.x-point.x,p.y-point.y)<=radius));
  if(!group){group={items:[],points:[],bounds:L.latLngBounds()};groups.push(group);}
  group.items.push(item);group.points.push(point);group.bounds.extend(item.latlng);
 });
 return groups;
}
function mewRefreshShelterClusters(){
 if(!shelterLayer)return;
 // Keep the clicked shelter marker mounted until its popup is dismissed.
 if(map._popup&&map.hasLayer(map._popup))return;
 shelterLayer.clearLayers();
 const clusterZoom=window.matchMedia("(max-width:700px)").matches?12:11;
 if(map.getZoom()>=clusterZoom){mewShelterItems.forEach(item=>item.layer.addTo(shelterLayer));return;}
 mewGroupNearby(mewShelterItems,62).forEach(group=>{
  if(group.items.length===1)group.items[0].layer.addTo(shelterLayer);
  else mewMakeCountCluster(group.items.length,group.bounds.getCenter(),group.bounds,"shelter").addTo(shelterLayer);
 });
}
map.on("zoomend",mewRefreshShelterClusters);
map.on("moveend",()=>{if(!map._popup)mewRefreshShelterClusters();});
map.on("popupclose",()=>requestAnimationFrame(()=>{if(!map._popup)mewRefreshShelterClusters();}));

const rainRadarLayer=L.tileLayer.wms("https://nowcoast.noaa.gov/geoserver/observations/weather_radar/ows",{layers:"conus_base_reflectivity_mosaic",styles:"",format:"image/png",transparent:true,version:"1.1.1",opacity:.72,attribution:"Radar: NOAA/NWS MRMS via nowCOAST"});
rainRadarLayer.on("loading",()=>{const e=$("rainRadarUpdated");if(e)e.textContent="Connecting to NOAA radar…";});
rainRadarLayer.on("load",()=>{const e=$("rainRadarUpdated");if(e)e.textContent="NOAA MRMS radar · Latest image loaded";});
rainRadarLayer.on("tileerror",()=>{const e=$("rainRadarUpdated");if(e)e.textContent="NOAA radar tiles unavailable · Try again later";});
let powerOutageFetchInProgress=false,usgsWaterFetchInProgress=false;
let powerOutageNextAllowedAt=0,powerOutageLastSuccessAt=null;
let nwsAlertFetchInProgress=false;
const nwsCountyCenter=[28.2639,-80.7214]; // approximate center of Brevard County; used only when NWS supplies no geometry.
let sourceMode="both";
let sheltersVisible=true;
const shelterToggleButton=$("shelterToggleBtn");
function syncShelterToggle(){if(!shelterToggleButton)return;shelterToggleButton.textContent="Shelters: "+(sheltersVisible?"On":"Off");shelterToggleButton.setAttribute("aria-pressed",String(sheltersVisible));}
if(shelterToggleButton)shelterToggleButton.addEventListener("click",()=>{sheltersVisible=!sheltersVisible;syncShelterToggle();applySourceFilter();});
function applySourceFilter(){
 const mode=sourceMode;
 const showCommunity=mode==="both"||mode==="community",showOfficial=mode==="both"||mode==="official",showPower=mode==="both"||mode==="power",showWater=mode==="both"||mode==="water",showRadar=mode==="both"||mode==="radar",showEvacuation=mode==="evacuation";const showShelters=sheltersVisible&&(mode==="both"||mode==="shelters");
 markers.forEach(marker=>{if(showCommunity){if(!map.hasLayer(marker))marker.addTo(map)}else if(map.hasLayer(marker))map.removeLayer(marker)});photoBubbleMarkers.forEach(marker=>{if(showCommunity){if(!map.hasLayer(marker))marker.addTo(map)}else if(map.hasLayer(marker))map.removeLayer(marker)});
 if(showOfficial){if(!map.hasLayer(nwsAlertLayer))nwsAlertLayer.addTo(map)}else if(map.hasLayer(nwsAlertLayer))map.removeLayer(nwsAlertLayer);
  if(showPower){if(!map.hasLayer(powerOutageAreaLayer))powerOutageAreaLayer.addTo(map);if(!map.hasLayer(powerOutageLayer))powerOutageLayer.addTo(map)}else{if(map.hasLayer(powerOutageAreaLayer))map.removeLayer(powerOutageAreaLayer);if(map.hasLayer(powerOutageLayer))map.removeLayer(powerOutageLayer)}
  if(showWater){if(!map.hasLayer(usgsWaterLayer))usgsWaterLayer.addTo(map);if(!map.hasLayer(noaaTideLayer))noaaTideLayer.addTo(map)}else{if(map.hasLayer(usgsWaterLayer))map.removeLayer(usgsWaterLayer);if(map.hasLayer(noaaTideLayer))map.removeLayer(noaaTideLayer)}
 if(showRadar){if(!map.hasLayer(rainRadarLayer))rainRadarLayer.addTo(map)}else if(map.hasLayer(rainRadarLayer))map.removeLayer(rainRadarLayer);
 if(showEvacuation){if(!map.hasLayer(evacuationZoneLayer))evacuationZoneLayer.addTo(map)}else if(map.hasLayer(evacuationZoneLayer))map.removeLayer(evacuationZoneLayer);
 if(showShelters){if(!map.hasLayer(shelterLayer))shelterLayer.addTo(map)}else if(map.hasLayer(shelterLayer))map.removeLayer(shelterLayer);
 const officialList=$("nwsAlertList"),communityList=$("latestReports");
 if(officialList)officialList.hidden=!showOfficial;
 if(communityList)communityList.hidden=!showCommunity;
 const status=$("nwsAlertStatus");if(status)status.hidden=!showOfficial;
  const powerStatus=$("powerOutageStatus");if(powerStatus)powerStatus.hidden=!showPower;
  const waterStatus=$("usgsWaterStatus");if(waterStatus)waterStatus.hidden=!showWater;
 const radarStatus=$("rainRadarStatus");if(radarStatus)radarStatus.hidden=!showRadar;
 const evacStatus=$("evacuationStatus");if(evacStatus)evacStatus.hidden=!showEvacuation;
}
/* Official Florida evacuation-zone reference polygons only. No route guidance is provided. */
let evacuationFetchInProgress=false;
async function loadEvacuationZones(){
 if(evacuationFetchInProgress||document.visibilityState==="hidden")return;
 evacuationFetchInProgress=true;
 const status=$("evacuationUpdated");
 try{
  const endpoint="https://services.arcgis.com/3wFbqsFPLeKqOlIK/ArcGIS/rest/services/NCS_Map_with_P_Surge_WFL1/FeatureServer/6/query";
  const params=new URLSearchParams({where:"County_Name='Brevard'",outFields:"County_Name,EZone",returnGeometry:"true",outSR:"4326",f:"geojson"});
  const response=await fetch(endpoint+"?"+params.toString(),{headers:{Accept:"application/geo+json"},cache:"no-store"});
  if(!response.ok)throw new Error("Evacuation zones HTTP "+response.status);
  const data=await response.json();
  if(data.error)throw new Error(data.error.message||"GIS service error");
  evacuationZoneLayer.clearLayers();
  const features=(data.features||[]).filter(f=>f.geometry);
  if(features.length){
   L.geoJSON(data,{style:f=>{const z=String(f.properties?.EZone||"").toUpperCase();const palette={A:"#e53935",B:"#f57c00",C:"#fbc02d",D:"#8bc34a",E:"#42a5f5",F:"#8e24aa",T:"#ad1457"};const color=palette[z]||"#e53935";return{color,weight:2,opacity:.95,fillColor:color,fillOpacity:.13,dashArray:"5 4"};},onEachFeature:(f,layer)=>{const zone=String(f.properties?.EZone||"Unspecified");layer.bindPopup("<strong>Brevard County evacuation zone "+esc(zone)+"</strong><br><small>Preparedness reference only. This is not an evacuation order. Follow Brevard Emergency Management for current instructions.</small>");}}).addTo(evacuationZoneLayer);
   if(status)status.textContent=features.length+" zone areas loaded · FDEM reference data";
  }else if(status)status.textContent="No zone polygons returned; use the official county map PDF.";
 }catch(error){
  console.warn("CoastWatch evacuation-zone feed unavailable:",error);
  if(status)status.textContent="Zone overlay temporarily unavailable · official PDF link below.";
 }finally{evacuationFetchInProgress=false;}
}
async function loadShelters(){
 if(shelterFetchInProgress||document.visibilityState==="hidden")return;
 shelterFetchInProgress=true;
 const count=$("shelterCount"),updated=$("shelterUpdated");
 try{
  const params=new URLSearchParams({where:"state = 'FL' AND shelter_status_code = 'OPEN'",geometry:"-81.05,27.75,-80.35,28.85",geometryType:"esriGeometryEnvelope",spatialRel:"esriSpatialRelIntersects",inSR:"4326",outFields:"*",returnGeometry:"true",outSR:"4326",f:"json",resultRecordCount:"500"});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
  let response;try{response=await fetch("https://gis.fema.gov/arcgis/rest/services/NSS/FEMA_NSS/MapServer/0/query?"+params.toString(),{headers:{Accept:"application/json"},cache:"no-store",signal:controller.signal});}finally{clearTimeout(timeout);}
  if(!response.ok)throw new Error("FEMA shelter service HTTP "+response.status);
  const payload=await response.json();
  if(payload.error)throw new Error(payload.error.message||"FEMA shelter service error");
  const features=(payload.features||[]).filter(f=>f.geometry&&(Array.isArray(f.geometry.coordinates)||(Number.isFinite(Number(f.geometry.x))&&Number.isFinite(Number(f.geometry.y)))));
  let items=[],femaOpenCount=0;
  const palette={OPEN:"#16834a",STANDBY:"#d69e18",ALERT:"#dc6b20",FULL:"#c2413b",CLOSED:"#64748b"};
  const labels={OPEN:"OPEN · FEMA status",STANDBY:"STANDBY · not confirmed open",ALERT:"ALERT · check official instructions",FULL:"FULL · do not assume space is available",CLOSED:"CLOSED",UNKNOWN:"STATUS UNAVAILABLE"};
  features.forEach(feature=>{
   const p=feature.attributes||feature.properties||{},g=feature.geometry||{},coords=g.coordinates;
   const lng=Number(Array.isArray(coords)?coords[0]:g.x),lat=Number(Array.isArray(coords)?coords[1]:g.y);
   if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
   const raw=String(p.shelter_status_code||"").toUpperCase(),status=Object.prototype.hasOwnProperty.call(labels,raw)?raw:"UNKNOWN";
   if(status!=="OPEN")return; // Public map displays only shelters explicitly marked OPEN by FEMA.
   const color=palette[status]||"#16834a";
   const name=esc(p.shelter_name||"Shelter location");
   const address=[p.address_1,p.city,p.state,p.zip].filter(Boolean).map(esc).join(", ");
   const pet=String(p.pet_accommodations_desc||"").trim();
   const accessible=String(p.wheelchair_accessible||p.ada_compliant||"").toUpperCase();
   const phone=String(p.org_poc_phone||p.org_main_phone||"").trim();
   const icon=L.divIcon({className:"mew-shelter-marker",html:'<span style="display:flex;align-items:center;justify-content:center;min-width:38px;height:38px;padding:0 5px;border:3px solid #fff;border-radius:12px;background:'+color+';box-shadow:0 2px 9px #0008;color:#fff;font-size:20px;font-weight:900">⌂</span>',iconSize:[42,42],iconAnchor:[21,21]});
   const popupHtml='<div style="min-width:220px"><strong>🏠 '+name+'</strong><div style="margin:6px 0;padding:7px 9px;border-radius:7px;background:'+color+';color:#fff;font-weight:800">'+esc(labels[status])+'</div><div>'+address+'</div>'+(accessible?'<div><b>Wheelchair / ADA:</b> '+esc(accessible)+'</div>':'')+(pet?'<div><b>Pet information:</b> '+esc(pet)+'</div>':'')+(phone?'<div><b>Phone:</b> '+esc(phone)+'</div>':'')+'<small style="display:block;margin-top:8px">Source: FEMA National Shelter System. Status and capacity can change. A listed location is not a direction to evacuate. Confirm opening with Brevard County before traveling.</small><p><a href="https://www.brevardfl.gov/StormCenter" target="_blank" rel="noopener noreferrer">Check official Brevard shelter announcements</a></p></div>';
   const marker=L.marker([lat,lng],{icon,pane:"mewShelterPane",title:(p.shelter_name||"Shelter")+" — "+labels[status]}).bindPopup(popupHtml,{maxWidth:300});
   items.push({latlng:L.latLng(lat,lng),layer:marker});femaOpenCount++;
  });
  // Brevard County Emergency Management reported South Mainland Community Center CLOSED
  // in its Nov. 5, 2026, 6:30 PM community update. Override stale FEMA/open feed entries.
  const southMainlandLat=27.8589916,southMainlandLng=-80.5012966;
  items=items.filter(item=>item.latlng.distanceTo(L.latLng(southMainlandLat,southMainlandLng))>=120);
  const southMainlandClosedColor="#64748b";
  const southMainlandClosedIcon=L.divIcon({className:"mew-shelter-marker",html:'<span style="display:flex;align-items:center;justify-content:center;min-width:42px;height:42px;padding:0 5px;border:3px solid #fff;border-radius:12px;background:'+southMainlandClosedColor+';box-shadow:0 2px 9px #0008;color:#fff;font-size:20px;font-weight:900">✕</span>',iconSize:[46,46],iconAnchor:[23,23]});
  const southMainlandClosedPopup='<div style="min-width:220px"><strong>🏠 South Mainland Community Center</strong><div style="margin:6px 0;padding:7px 9px;border-radius:7px;background:'+southMainlandClosedColor+';color:#fff;font-weight:800">CLOSED · LAST COUNTY REPORT NOV 5 · VERIFY</div><div>3700 Allen Ave, Micco, FL 32976</div><small style="display:block;margin-top:8px">Brevard County Emergency Management last reported this shelter closed on November 5, 2026. This is not a live status check; verify with the County Storm Center or call 2-1-1 before traveling.</small><p><a href="https://www.brevardfl.gov/StormCenter" target="_blank" rel="noopener noreferrer">Brevard County Storm Center</a></p></div>';
  const southMainlandClosedMarker=L.marker([southMainlandLat,southMainlandLng],{icon:southMainlandClosedIcon,pane:"mewShelterPane",title:"South Mainland Community Center — LAST REPORTED CLOSED NOV 5"}).bindPopup(southMainlandClosedPopup,{maxWidth:300});
  items.push({latlng:L.latLng(southMainlandLat,southMainlandLng),layer:southMainlandClosedMarker});
  mewShelterItems=items;
  mewRefreshShelterClusters();
  if(count)count.textContent=femaOpenCount?femaOpenCount+" FEMA-confirmed open shelters":"No FEMA-confirmed open shelters";
  if(updated)updated.textContent="FEMA National Shelter System · checked "+new Date().toLocaleTimeString()+" · only explicit OPEN statuses shown";
 }catch(error){
  console.warn("CoastWatch shelter locations unavailable:",error);
  // Keep the county-confirmed CLOSED status visible even if FEMA's feed fails.
  const southMainlandClosedColor="#64748b";
  const southMainlandClosedIcon=L.divIcon({className:"mew-shelter-marker",html:'<span style="display:flex;align-items:center;justify-content:center;min-width:42px;height:42px;padding:0 5px;border:3px solid #fff;border-radius:12px;background:'+southMainlandClosedColor+';box-shadow:0 2px 9px #0008;color:#fff;font-size:20px;font-weight:900">✕</span>',iconSize:[46,46],iconAnchor:[23,23]});
  const southMainlandClosedPopup='<div style="min-width:220px"><strong>🏠 South Mainland Community Center</strong><div style="margin:6px 0;padding:7px 9px;border-radius:7px;background:'+southMainlandClosedColor+';color:#fff;font-weight:800">CLOSED · LAST COUNTY REPORT NOV 5 · VERIFY</div><div>3700 Allen Ave, Micco, FL 32976</div><small>Brevard County Emergency Management last reported this shelter closed on November 5, 2026. This is not a live status check; verify with the County Storm Center or call 2-1-1 before traveling.</small><p><a href="https://www.brevardfl.gov/StormCenter" target="_blank" rel="noopener noreferrer">Brevard County Storm Center</a></p></div>';
  const southMainlandClosedMarker=L.marker([27.8589916,-80.5012966],{icon:southMainlandClosedIcon,pane:"mewShelterPane",title:"South Mainland Community Center — LAST REPORTED CLOSED NOV 5"}).bindPopup(southMainlandClosedPopup,{maxWidth:300});
  mewShelterItems=mewShelterItems.filter(item=>item.latlng.distanceTo(L.latLng(27.8589916,-80.5012966))>=120);
  mewShelterItems.push({latlng:L.latLng(27.8589916,-80.5012966),layer:southMainlandClosedMarker});
  mewRefreshShelterClusters();

  if(count)count.textContent="Shelter data unavailable";
  if(updated)updated.textContent=(error.name==="AbortError"?"FEMA request timed out":"FEMA feed error: "+String(error.message||error)).slice(0,130);
 }
 finally{shelterFetchInProgress=false;}
}
async function loadUSGSWaterLevels(){
 if(usgsWaterFetchInProgress||document.visibilityState==="hidden")return;usgsWaterFetchInProgress=true;
 const count=$("usgsWaterCount"),updated=$("usgsWaterUpdated");
 try{
  const url="https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items?f=json&limit=500&state_code=12&county_code=009&parameter_code=00065";
  const response=await fetch(url,{headers:{Accept:"application/geo+json, application/json"},cache:"no-store"});
  if(!response.ok)throw new Error("USGS HTTP "+response.status);
  const payload=await response.json();
  const features=Array.isArray(payload.features)?payload.features:[];
  const latestBySite=new Map();
  features.forEach(feature=>{
   const p=feature.properties||{},id=p.monitoring_location_id||p.id;
   if(!id||!feature.geometry||p.value==null)return;
   const previous=latestBySite.get(id);
   if(!previous||new Date(p.time||0)>new Date(previous.properties?.time||0))latestBySite.set(id,feature);
  });
  usgsWaterLayer.clearLayers();
  const waterIcon=L.divIcon({className:"mew-usgs-water-icon",html:'<span style="display:block;color:#38bdf8;font-size:25px;line-height:30px;text-shadow:-1px -1px 0 #063b61,1px 1px 0 #063b61,0 2px 4px #000b">💧</span>',iconSize:[30,30],iconAnchor:[15,15]});
  latestBySite.forEach(feature=>{
   const p=feature.properties||{},coords=feature.geometry?.coordinates;
   if(!Array.isArray(coords)||coords.length<2)return;
   const value=Number(p.value),unit=p.unit_of_measure||"unit not reported";
   const station=esc(p.monitoring_location_name||p.monitoring_location_id||"USGS monitoring station");
   const timestamp=p.time?new Date(p.time).toLocaleString():"Time not reported";
   const status=String(p.approval_status||"").toLowerCase()==="approved"?"Approved":"Provisional / subject to revision";
    const modified=p.last_modified?new Date(p.last_modified).toLocaleString():"Not provided";
    const ageHours=p.time?(Date.now()-new Date(p.time).getTime())/3600000:Infinity;
    const freshness=ageHours>24?"Older than 24 hours · last available observation":ageHours>6?"Older than 6 hours":"Recent observation";
   const popupHtml='<div style="min-width:210px"><strong>💧 USGS water-level monitoring</strong><div style="margin-top:5px"><b>'+station+'</b></div><div><b>Latest gage height:</b> '+esc(Number.isFinite(value)?value.toLocaleString(undefined,{maximumFractionDigits:3}):p.value)+' '+esc(unit)+'</div><div><b>Reading time:</b> '+esc(timestamp)+'</div><div><b>Data status:</b> '+esc(status)+'</div><div><b>Freshness:</b> '+esc(freshness)+'</div><div><b>USGS last modified:</b> '+esc(modified)+'</div><small>Source: U.S. Geological Survey. Observation time is shown above; telemetry may be delayed. A gauge reading does not confirm flooding at nearby roads or properties.</small><p><a href="https://waterdata.usgs.gov/monitoring-location/'+encodeURIComponent(p.monitoring_location_id||"")+'" target="_blank" rel="noopener noreferrer">Open USGS station details ↗</a></p></div>';
   L.marker([coords[1],coords[0]],{icon:waterIcon,zIndexOffset:300}).bindPopup(popupHtml).addTo(usgsWaterLayer);
  });
  if(count)count.textContent=latestBySite.size?latestBySite.size+" water-level "+(latestBySite.size===1?"station":"stations"):"No recent USGS readings";
  const observationTimes=Array.from(latestBySite.values()).map(f=>new Date(f.properties?.time||0)).filter(d=>Number.isFinite(d.getTime())&&d.getTime()>0);
  const newestObservation=observationTimes.length?new Date(Math.max(...observationTimes.map(d=>d.getTime()))):null;
  if(updated)updated.textContent=newestObservation?"USGS · Latest observation "+newestObservation.toLocaleString():"USGS has no recent Brevard gage-height observations · Check NWS river alerts";
 }catch(error){
  console.warn("CoastWatch USGS water data unavailable:",error);
  if(count)count.textContent="Water data unavailable";
  if(updated)updated.textContent="USGS feed unavailable · Try again later";
 }finally{usgsWaterFetchInProgress=false;}
}

async function loadNoaaTideLevel(){
 if(noaaTideFetchInProgress||document.visibilityState==="hidden")return;
 noaaTideFetchInProgress=true;
 const count=$("noaaTideCount"),updated=$("noaaTideUpdated");
 try{
  const stationResponse=await fetch("https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/8721604.json",{headers:{Accept:"application/json"},cache:"no-store"});
  if(!stationResponse.ok)throw new Error("NOAA station metadata HTTP "+stationResponse.status);
  const stationPayload=await stationResponse.json();
  const station=(stationPayload.stations||[])[0];
  if(!station||!Number.isFinite(Number(station.lat))||!Number.isFinite(Number(station.lng)))throw new Error("NOAA station coordinates unavailable");
  const params=new URLSearchParams({date:"latest",station:"8721604",product:"water_level",datum:"MLLW",time_zone:"lst_ldt",units:"english",format:"json"});
  const dataResponse=await fetch("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?"+params.toString(),{headers:{Accept:"application/json"},cache:"no-store"});
  if(!dataResponse.ok)throw new Error("NOAA tide data HTTP "+dataResponse.status);
  const payload=await dataResponse.json();
  if(payload.error)throw new Error(payload.error.message||"NOAA tide data unavailable");
  const reading=(payload.data||[]).filter(x=>x.v!==undefined).slice(-1)[0];
  noaaTideLayer.clearLayers();
  if(!reading)throw new Error("No latest NOAA water-level observation returned");
  const value=Number(reading.v),time=reading.t||"Time not reported";
  const status=reading.q==="p"?"Preliminary":"Verified / quality-controlled";
  const icon=L.divIcon({className:"mew-noaa-tide-icon",html:'<span style="display:block;color:#67e8f9;font-size:25px;line-height:30px;text-shadow:-1px -1px 0 #064e5b,1px 1px 0 #064e5b,0 2px 4px #000b">🌊</span>',iconSize:[30,30],iconAnchor:[15,15]});
  const popup='<div style="min-width:210px"><strong>🌊 NOAA coastal water-level station</strong><div style="margin-top:5px"><b>'+esc(station.name||"Trident Pier")+'</b></div><div><b>Latest water level:</b> '+esc(Number.isFinite(value)?value.toFixed(2):reading.v)+' ft</div><div><b>Reading time:</b> '+esc(new Date(time).toLocaleString())+'</div><div><b>Data status:</b> '+esc(status)+'</div><small>Source: NOAA Center for Operational Oceanographic Products and Services. Datum: Mean Lower Low Water (MLLW). This is a coastal water-level observation, not a flood warning or forecast.</small><p><a href="https://tidesandcurrents.noaa.gov/stationhome.html?id=8721604" target="_blank" rel="noopener noreferrer">Open official NOAA station ↗</a></p></div>';
  L.marker([Number(station.lat),Number(station.lng)],{icon,zIndexOffset:320}).bindPopup(popup).addTo(noaaTideLayer);
  if(count)count.textContent=Number.isFinite(value)?value.toFixed(2)+" ft · latest reading":"Latest reading available";
  if(updated)updated.textContent="NOAA Trident Pier · "+new Date(time).toLocaleString()+" · MLLW";
 }catch(error){
  console.warn("CoastWatch NOAA tide feed unavailable:",error);
  if(count)count.textContent="NOAA tide data unavailable";
  if(updated)updated.textContent="NOAA CO-OPS feed unavailable · Try again later";
 }finally{noaaTideFetchInProgress=false;}
}

let powerOutageAreasFetchInProgress=false;
async function loadPowerOutageAreas(){
 if(powerOutageAreasFetchInProgress||document.visibilityState==="hidden")return;
 powerOutageAreasFetchInProgress=true;
 try{
  const response=await fetch("/api/power-outage-areas",{headers:{"Accept":"application/geo+json, application/json"},cache:"no-store"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const payload=await response.json();
  const features=Array.isArray(payload.features)?payload.features:(Array.isArray(payload.data?.features)?payload.data.features:[]);
  const valid=features.filter(f=>f&&f.geometry);
  const areas=L.geoJSON({type:"FeatureCollection",features:valid},{style:()=>({color:"#f59e0b",weight:2,opacity:.9,fillColor:"#facc15",fillOpacity:.12,dashArray:"6 5"}),onEachFeature:(feature,layer)=>{
   const p=feature.properties||{};
   const name=p.name||p.area_name||"Reported municipality";
   const utility=p.utility_name||p.utility_key||"Utility not identified";
   const customers=p.customers_out==null?"Not reported":Number(p.customers_out).toLocaleString();
   const masked=Number(p.masked_outages||0);
   const served=p.customers_served==null?"Not reported":Number(p.customers_served).toLocaleString();
   const percent=p.pct_out==null?"Not reported":Number(p.pct_out).toFixed(1)+"%";
   const incidents=p.incident_count==null?"Not reported":Number(p.incident_count).toLocaleString();
   const etr=p.etr?new Date(p.etr).toLocaleString():"Not provided";
   const notice=masked>0?"<div><b>Additional masked outages:</b> "+esc(masked.toLocaleString())+" (reported below a privacy threshold)</div>":"";
   layer.bindPopup('<div style="min-width:220px"><strong>⚡ Approximate outage area</strong><div><b>'+esc(name)+'</b></div><div><b>Utility:</b> '+esc(utility)+'</div><div><b>Customers out:</b> '+esc(customers)+'</div>'+notice+'<div><b>Customers served:</b> '+esc(served)+'</div><div><b>Share affected:</b> '+esc(percent)+'</div><div><b>Incidents:</b> '+esc(incidents)+'</div><div><b>Estimated restoration:</b> '+esc(etr)+'</div><small>Dashed polygon is a bounding box around a utility-reported municipality, not an exact outage footprint or confirmation that every address inside is without power. Source: MassOutage.</small></div>');
  }});
  powerOutageAreaLayer.clearLayers();
  areas.addTo(powerOutageAreaLayer);
  const live=payload.meta?.live||{};
  const status=$("powerOutageUpdated");
  if(status&&live.status==="delayed")status.textContent=(live.notice||"MassOutage outage-area data may be delayed")+" · Approximate boundaries";
 }catch(error){
  console.warn("CoastWatch outage-area overlay unavailable:",error);
  // Polygon failures are isolated: incident markers continue to work normally.
 }finally{powerOutageAreasFetchInProgress=false;}
}
async function loadPowerOutages(){
 if(powerOutageFetchInProgress)return;
 const count=$("powerOutageCount"),updated=$("powerOutageUpdated");
 const now=Date.now();
 if(now<powerOutageNextAllowedAt){
  const waitMinutes=Math.max(1,Math.ceil((powerOutageNextAllowedAt-now)/60000));
  if(updated)updated.textContent="MassOutage rate limit · retry in about "+waitMinutes+" min"+(powerOutageLastSuccessAt?" · Last successful update "+powerOutageLastSuccessAt.toLocaleTimeString():" · No successful update yet");
  return;
 }
 powerOutageFetchInProgress=true;
 try{
  const response=await fetch("/api/power-outages",{headers:{"Accept":"application/geo+json, application/json"},cache:"no-store"});
  if(!response.ok){const err=new Error("HTTP "+response.status);err.status=response.status;err.retryAfter=response.headers.get("Retry-After");throw err;}
  const fetchedAt=response.headers.get("X-CoastWatch-Fetched-At");
  const cacheState=response.headers.get("X-CoastWatch-Cache");
  const dataSource=response.headers.get("X-Data-Source")||"MassOutage";
  const headerNotice=response.headers.get("X-Data-Notice");
  const payload=await response.json();
  const features=Array.isArray(payload.features)?payload.features:(Array.isArray(payload.data?.features)?payload.data.features:[]);
  const outageIcon=L.divIcon({className:"mew-power-outage-icon",html:'<span style="display:block;color:#facc15;font-size:30px;font-weight:900;line-height:34px;text-shadow:-1.5px -1.5px 0 #704600,1.5px 1.5px 0 #704600,0 2px 4px #000b">⚡</span>',iconSize:[30,34],iconAnchor:[15,17]});
  const outageDate=value=>{
   if(!value)return "";
   const date=new Date(value);
   return Number.isNaN(date.getTime())?String(value):date.toLocaleString();
  };
  const pick=(...values)=>values.find(value=>value!==undefined&&value!==null&&String(value).trim()!=="");
  const freshLayer=L.geoJSON({type:"FeatureCollection",features},{pointToLayer:(feature,latlng)=>L.marker(latlng,{icon:outageIcon,zIndexOffset:350}),onEachFeature:(feature,layer)=>{
   const p=feature.properties||{};
   const utility=pick(p.utility_name,p.utility,p.utility_key,p.provider_name);
   const customers=pick(p.customers_out,p.customers_affected,p.affected_customers,p.customer_count);
   const threshold=pick(p.customers_below,p.customers_out_below,p.customer_count_threshold);
   const cause=pick(p.cause,p.cause_description,p.outage_cause);
   const restoration=pick(p.etr,p.estimated_restoration,p.estimated_restore_time,p.restoration_time);
   const crew=pick(p.crew_status,p.status,p.outage_status);
   const started=pick(p.started_at,p.start_time,p.outage_start,p.reported_at);
   const updatedAt=pick(p.as_of,p.updated_at,p.last_updated,p.timestamp,p.last_modified);
   const location=pick(p.location,p.address,p.area_name,p.municipality);
   const rows=["<strong>⚡ Reported power outage</strong>",
    utility?"<div><b>Utility:</b> "+esc(utility)+"</div>":"",
    cause?"<div><b>Cause:</b> "+esc(cause)+"</div>":"",
    customers!=null?"<div><b>Customers affected:</b> "+esc(Number.isFinite(Number(customers))?Number(customers).toLocaleString():customers)+"</div>":threshold!=null?"<div><b>Customers affected:</b> Less than "+esc(threshold)+"</div>":"",
    restoration?"<div><b>Estimated restoration:</b> "+esc(outageDate(restoration))+"</div>":"",
    crew?"<div><b>Crew / outage status:</b> "+esc(crew)+"</div>":"",
    started?"<div><b>Outage began:</b> "+esc(outageDate(started))+"</div>":"",
    updatedAt?"<div><b>Utility update:</b> "+esc(outageDate(updatedAt))+"</div>":"",
    location?"<div><b>Reported area:</b> "+esc(location)+"</div>":"",
    '<small>Source: '+esc(dataSource)+' · Utility-reported information may be approximate or delayed. Confirm with your electric provider.</small><div><a href="https://www.fpl.com/outage/" target="_blank" rel="noopener noreferrer">Check the official FPL outage map ↗</a></div>'];
   layer.bindPopup('<div style="min-width:200px">'+rows.filter(Boolean).join("")+'</div>');
  }});
  powerOutageLayer.clearLayers();freshLayer.addTo(powerOutageLayer);
  powerOutageLastSuccessAt=new Date();powerOutageNextAllowedAt=0;
  const total=features.length;
  if(count)count.textContent=total+" outage "+(total===1?"incident":"incidents");
  const live=payload.meta?.live||payload.meta?.status||{},delayed=live.status==="delayed";
  const sourceUpdated=pick(payload.meta?.as_of,payload.meta?.updated_at,payload.meta?.last_updated,payload.meta?.generated_at);
  const fetchedLabel=fetchedAt&&!Number.isNaN(Date.parse(fetchedAt))?new Date(fetchedAt).toLocaleString():powerOutageLastSuccessAt.toLocaleString();
  const freshnessLabel=sourceUpdated?"Source data timestamp "+outageDate(sourceUpdated):"Retrieved "+fetchedLabel;
  const cacheLabel=cacheState==="HIT"?" · cached response":"";
  const notice=headerNotice||live.notice;
  if(updated)updated.textContent=(notice||"MassOutage utility outage reports")+" · "+freshnessLabel+cacheLabel+(delayed?" · delayed":"");
 }catch(error){
  console.warn("CoastWatch power outage feed unavailable:",error);
  if(error.status===429){
   const retrySeconds=Number(error.retryAfter),retryDate=error.retryAfter&&!Number.isNaN(Date.parse(error.retryAfter))?Date.parse(error.retryAfter):0;
   const backoffMs=retryDate?Math.max(15*60*1000,retryDate-Date.now()):(Number.isFinite(retrySeconds)&&retrySeconds>0?Math.max(15*60*1000,retrySeconds*1000):15*60*1000);
   powerOutageNextAllowedAt=Date.now()+backoffMs;
   if(count)count.textContent=powerOutageLayer.getLayers().length?"Showing last known data":"Rate limited";
   if(updated)updated.textContent="MassOutage rate limit · retry in "+Math.ceil(backoffMs/60000)+" min"+(powerOutageLastSuccessAt?" · Last successful update "+powerOutageLastSuccessAt.toLocaleTimeString():" · No successful update yet");
  }else{
   if(count)count.textContent=powerOutageLayer.getLayers().length?"Showing last known data":"Power data unavailable";
   if(updated)updated.textContent="MassOutage unavailable"+(powerOutageLastSuccessAt?" · Last successful update "+powerOutageLastSuccessAt.toLocaleTimeString():" · No successful update yet");
  }
 }finally{powerOutageFetchInProgress=false;}
}
function nwsSeverityColor(value){
 const v=String(value||"").toLowerCase();
 if(v==="extreme")return "#b91c1c";   // red
 if(v==="severe")return "#ea580c";    // orange
 if(v==="moderate")return "#ca8a04";  // gold
 if(v==="minor")return "#2563eb";     // blue
 return "#64748b";                    // slate: unspecified
}
function nwsSafeDate(value){
 if(!value)return "Not provided";
 const d=new Date(value);
 return Number.isNaN(d.getTime())?"Not provided":d.toLocaleString();
}
function nwsPopup(p,approximate){
 const title=p.event||"National Weather Service alert";
 const rows=[
  "<strong>"+esc(title)+"</strong>",
  p.headline?esc(p.headline):"",
  p.areaDesc?"<div><strong>Area:</strong> "+esc(p.areaDesc)+"</div>":"",
  p.severity?"<div><strong>Severity:</strong> "+esc(p.severity)+"</div>":"",
  p.urgency?"<div><strong>Urgency:</strong> "+esc(p.urgency)+"</div>":"",
  "<div><strong>Effective:</strong> "+esc(nwsSafeDate(p.effective))+"</div>",
  "<div><strong>Expires:</strong> "+esc(nwsSafeDate(p.expires))+"</div>",
  approximate?'<div style="margin-top:6px;color:#a16207"><strong>Approximate county marker:</strong> NWS did not provide a map boundary for this alert. This pin represents the county area, not the exact hazard location.</div>':"",
  p.description?'<p style="white-space:pre-wrap;max-height:160px;overflow:auto">'+esc(p.description.slice(0,2600))+"</p>":"",
  p.instruction?'<p><strong>Instructions:</strong><br>'+esc(p.instruction.slice(0,1400))+"</p>":"",
  p.web?'<a href="'+esc(p.web)+'" target="_blank" rel="noopener noreferrer">Open official NWS alert</a>':"",
  '<small style="display:block;margin-top:8px">Source: National Weather Service · Official alert feed. CoastWatch FL is not an emergency service.</small>'
 ];
 return '<div style="min-width:220px;max-width:320px">'+rows.filter(Boolean).join("")+"</div>";
}
function updateRipCurrentNotice(features){
 const section=$("cwRipCurrentNotice");if(!section)return;
 const active=(features||[]).filter(feature=>String(feature.properties?.event||"").toLowerCase().includes("rip current")).sort((a,b)=>new Date(a.properties?.expires||0)-new Date(b.properties?.expires||0));
 if(!active.length){section.hidden=true;return;}
 const p=active[0].properties||{};
 section.hidden=false;
 const summary=$("cwRipCurrentSummary"),timing=$("cwRipCurrentTiming"),link=section.querySelector("a"),kicker=section.querySelector(".cw-rip-kicker");
 if(kicker)kicker.textContent="CoastWatch FL · Official NWS Coastal Hazard · Checked "+new Date().toLocaleString();
 if(summary)summary.textContent=p.headline||("The National Weather Service has an active "+(p.event||"rip current")+" alert for "+(p.areaDesc||"the Brevard County coast")+".");
 if(timing){
  const expiry=p.expires?new Date(p.expires):null;
  timing.textContent=expiry&&!Number.isNaN(expiry.getTime())?"In effect until "+expiry.toLocaleString()+". Entering the surf is strongly discouraged. Follow lifeguards, beach flags, and posted signs.":"An active NWS coastal hazard is in effect. Entering the surf is strongly discouraged.";
 }
 if(link&&p.web)link.href=p.web;
}
function renderNwsAlertList(features){
 const host=$("nwsAlertList");if(!host)return;
 if(!features.length){host.innerHTML='<div class="mew-news-empty"><span>✓</span><div><strong>No active NWS alerts</strong><small>No active National Weather Service alerts are currently listed for Brevard County.</small></div></div>';return;}
 const rank={extreme:0,severe:1,moderate:2,minor:3,unknown:4};
 const ordered=[...features].sort((a,b)=>(rank[String(a.properties?.severity||"unknown").toLowerCase()]??4)-(rank[String(b.properties?.severity||"unknown").toLowerCase()]??4));
 host.innerHTML=ordered.slice(0,8).map(f=>{
  const p=f.properties||{},severity=String(p.severity||"Unknown"),level=severity.toLowerCase(),color=nwsSeverityColor(p.severity);
  return '<article class="report mew-official-alert-card mew-severity-'+esc(level)+'" style="--mew-alert-color:'+color+'"><div class="mew-alert-card-top"><strong>'+esc(p.event||"Weather alert")+'</strong><span class="mew-alert-severity">'+esc(severity)+'</span></div><small class="mew-alert-area">'+esc(p.areaDesc||"Brevard County")+'</small>'+(p.headline?'<p class="report-description">'+esc(p.headline)+'</p>':"")+'<div class="mew-alert-card-bottom"><small>Expires '+esc(nwsSafeDate(p.expires))+'</small>'+(p.web?'<a href="'+esc(p.web)+'" target="_blank" rel="noopener noreferrer">Official NWS details ↗</a>':"")+'</div><small class="mew-source-label">OFFICIAL · NATIONAL WEATHER SERVICE</small></article>';
 }).join("");
}
async function loadNwsAlerts(){
 if(nwsAlertFetchInProgress||document.visibilityState==="hidden")return;
 nwsAlertFetchInProgress=true;
 const status=$("nwsAlertStatus");
 try{
  // Include Brevard County and all four Brevard coastal/mainland forecast zones.
  // County-only alerts omit coastal rip-current products.
  const nwsZones=["FLC009","FLZ141","FLZ154","FLZ159","FLZ164","FLZ247","FLZ347","FLZ447","FLZ647","FLZ747"];
  const zoneResponses=await Promise.all(nwsZones.map(async zone=>{
   const response=await fetch("https://api.weather.gov/alerts/active?zone="+encodeURIComponent(zone),{headers:{Accept:"application/geo+json"},cache:"no-store"});
   if(!response.ok)throw new Error("NWS API returned HTTP "+response.status+" for "+zone);
   return response.json();
  }));
  const uniqueFeatures=new Map();
  zoneResponses.forEach(body=>(body.features||[]).forEach(feature=>{
   const p=feature&&feature.properties||{};
   if(p.status!=="Test"&&p.messageType!=="Cancel"&&p.status!=="Expired"){
    uniqueFeatures.set(feature.id||p.id||[p.event,p.effective,p.areaDesc].join("|"),feature);
   }
  }));
  const features=Array.from(uniqueFeatures.values());
  nwsAlertLayer.clearLayers();
  features.forEach(feature=>{
   const p=feature.properties||{},eventName=String(p.event||"").toLowerCase(),isRipCurrent=eventName.includes("rip current"),color=isRipCurrent?"#facc15":nwsSeverityColor(p.severity),popup=nwsPopup(p,!feature.geometry);
   if(isRipCurrent){
    // Approximate Brevard beach/water corridor only; the full multi-county alert remains in the official alert details.
    const coastRisk=[[28.78,-80.48],[28.66,-80.52],[28.52,-80.55],[28.38,-80.56],[28.22,-80.55],[28.06,-80.54],[27.91,-80.51],[27.82,-80.48],[27.82,-80.40],[27.93,-80.42],[28.08,-80.44],[28.24,-80.45],[28.40,-80.46],[28.55,-80.46],[28.69,-80.44],[28.78,-80.42]];
    L.polygon(coastRisk,{interactive:true,color:"#eab308",weight:3,opacity:1,fillColor:"#facc15",fillOpacity:.27,dashArray:"7 5"}).bindPopup(popup).addTo(nwsAlertLayer);
   }else if(feature.geometry){
    L.geoJSON(feature,{interactive:false,style:()=>({color,weight:3,opacity:1,fillColor:color,fillOpacity:.15,dashArray:"6 4"}),pointToLayer:(_f,latlng)=>L.circleMarker(latlng,{interactive:true,radius:13.3,color:"#fff",weight:2,fillColor:color,fillOpacity:1}),onEachFeature:(f,layer)=>{if(["Point","MultiPoint"].includes(f.geometry?.type)){layer.options.interactive=true;layer.bindPopup(popup);}}}).addTo(nwsAlertLayer);
   }else if(eventName.includes("flood")&&String(p.headline||"").toLowerCase().includes("st. johns river")){
    const river=[[28.54,-80.99],[28.55,-80.90],[28.35,-80.80],[28.05,-80.72]];
    L.polyline(river,{interactive:true,color,weight:7,opacity:.9,dashArray:"8 6"}).bindPopup(popup).addTo(nwsAlertLayer);
   }else{
    L.circleMarker(nwsCountyCenter,{interactive:true,radius:11,color:"#fff",weight:2,fillColor:color,fillOpacity:1}).bindPopup(popup).addTo(nwsAlertLayer);
   }
  });
  updateRipCurrentNotice(features);
   renderNwsAlertList(features);
  if(status)status.textContent="Official NWS alerts: "+features.length+" active for Brevard County · refreshed "+new Date().toLocaleTimeString()+".";
 }catch(error){
  console.warn("CoastWatch NWS feed unavailable:",error);
  if(status)status.textContent="Official NWS feed temporarily unavailable. Community reports are unaffected. Check weather.gov for current alerts.";
  const ripNotice=$("cwRipCurrentNotice");
  const fallbackExpiry=Date.parse(ripNotice?.dataset?.fallbackExpires||"");
  if(ripNotice&&fallbackExpiry&&Date.now()>fallbackExpiry)ripNotice.hidden=true;
  const host=$("nwsAlertList");if(host)host.innerHTML='<div class="hint">Unable to retrieve NWS alerts right now. This does not affect community reports.</div>';
 }finally{nwsAlertFetchInProgress=false;}
}

const imagery=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"Tiles © Esri — Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community",maxZoom:19,updateWhenZooming:false,updateWhenIdle:true,keepBuffer:4});
const labels=L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",{attribution:"",maxZoom:19,updateWhenZooming:false,updateWhenIdle:true,keepBuffer:4});
const roadLabels=L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",{attribution:"Road data © Esri, HERE, Garmin, and OpenStreetMap contributors",maxZoom:19,opacity:1,updateWhenZooming:false,updateWhenIdle:true,keepBuffer:4});
const streets=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors",maxZoom:19,updateWhenZooming:false,updateWhenIdle:true,keepBuffer:4});
imagery.addTo(map);
labels.addTo(map);
roadLabels.addTo(map);
roadLabels.on("tileerror",()=>{const note=document.querySelector("#map-panel .mapnote");if(note)note.textContent="Street-name overlay is temporarily unavailable. Satellite imagery remains available.";});
streets.on("tileerror",()=>{const note=document.querySelector("#map-panel .mapnote");if(note)note.textContent="Map tiles are temporarily unavailable. Please refresh or use the official emergency links below.";});
imagery.on("tileerror",()=>{if(map.hasLayer(imagery)){map.removeLayer(imagery);streets.addTo(map);const note=document.querySelector("#map-panel .mapnote");if(note)note.textContent="Satellite imagery is unavailable; showing the street map instead.";}});

$("satelliteBtn").onclick=()=>{map.removeLayer(streets);if(!map.hasLayer(imagery))imagery.addTo(map);if(!map.hasLayer(labels))labels.addTo(map);if(!map.hasLayer(roadLabels))roadLabels.addTo(map)};
$("streetBtn").onclick=()=>{map.removeLayer(imagery);map.removeLayer(labels);map.removeLayer(roadLabels);streets.addTo(map)};
$("satelliteBtn").addEventListener("click",()=>{$("satelliteBtn").classList.add("active");$("streetBtn").classList.remove("active")});$("streetBtn").addEventListener("click",()=>{$("streetBtn").classList.add("active");$("satelliteBtn").classList.remove("active")});
const selectedLocationIcon=L.divIcon({className:"selected-location-pin",html:'<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" aria-hidden="true"><path d="M18 1C8.6 1 1 8.5 1 17.7 1 30 18 47 18 47s17-17 17-29.3C35 8.5 27.4 1 18 1Z" fill="#e52b3b" stroke="#fff" stroke-width="2.5"/><circle cx="18" cy="17" r="6" fill="#fff"/></svg>',iconSize:[36,48],iconAnchor:[18,47],popupAnchor:[0,-43]});
let selectedLocationMarker=null;let mapFilter="all";
let reportPlacementMode=false;
function updateLocationConfirmation(latlng){
 const label=latlng.lat.toFixed(5)+", "+latlng.lng.toFixed(5);
 $("locationConfirmation").textContent="Location selected on map · "+label;
 $("mapReportHint").textContent="Location selected. You can drag the pin to adjust it.";
 $("mapReportBtn").textContent="＋ Change location";
 $("mapReportBtn").classList.remove("is-placing");
}
function setSelectedLocation(latlng){
 $("latitude").value=latlng.lat.toFixed(6);$("longitude").value=latlng.lng.toFixed(6);
 if(!selectedLocationMarker){
  selectedLocationMarker=L.marker(latlng,{icon:selectedLocationIcon,draggable:true,zIndexOffset:1000}).addTo(map).bindPopup("Selected report location — drag the pin to fine-tune it.");
  selectedLocationMarker.on("dragend",()=>{const p=selectedLocationMarker.getLatLng();$("latitude").value=p.lat.toFixed(6);$("longitude").value=p.lng.toFixed(6);updateLocationConfirmation(p);});
 }else{selectedLocationMarker.setLatLng(latlng);}
 updateLocationConfirmation(latlng);selectedLocationMarker.openPopup();
 if(reportPlacementMode){
  reportPlacementMode=false;
  $("mapReportHint").textContent="Location set. Complete the report below the map.";
  $("report-panel").scrollIntoView({behavior:"smooth",block:"start"});
  setTimeout(()=> $("category").focus({preventScroll:true}),450);
 }
}
$("reportChooseLocationBtn").addEventListener("click",()=>{$("mapReportBtn").click();$("map-panel").scrollIntoView({behavior:"smooth",block:"start"});});
$("mapReportBtn").addEventListener("click",()=>{
 reportPlacementMode=true;
 $("mapReportBtn").textContent="Tap map to place pin";
 $("mapReportBtn").classList.add("is-placing");
 $("mapReportHint").textContent="Now tap the map where you observed the hazard.";
 map.getContainer().classList.add("is-selecting-location");
 map.closePopup();
});
map.on("click",e=>{
 if(reportPlacementMode){setSelectedLocation(e.latlng);map.getContainer().classList.remove("is-selecting-location");}
 else if($("latitude").value&&$("longitude").value){setSelectedLocation(e.latlng);}
});
// Device location is requested only after the visitor taps the button.
 // Coordinates stay in this page's memory; they are not sent to Supabase or saved.
 let myLocationMarker=null,myLocationAccuracy=null;
 $("locateBtn").onclick=()=>{const b=$("locateBtn");b.disabled=true;b.textContent="Locating…";map.locate({setView:true,maxZoom:15,enableHighAccuracy:true,timeout:12000,maximumAge:0});};
 let mewLocationMessage=document.getElementById("mewLocationMessage");
 if(!mewLocationMessage){mewLocationMessage=document.createElement("div");mewLocationMessage.id="mewLocationMessage";mewLocationMessage.setAttribute("role","status");mewLocationMessage.setAttribute("aria-live","polite");mewLocationMessage.style.cssText="display:none;margin:7px 0 0;padding:9px 11px;border:1px solid rgba(80,190,190,.3);border-radius:10px;background:rgba(8,42,58,.88);color:#dceff5;font-size:12px;line-height:1.45";$("locateBtn").insertAdjacentElement("afterend",mewLocationMessage);}
 function mewShowLocationMessage(message){mewLocationMessage.textContent=message;mewLocationMessage.style.display="block";}
 function mewClearLocationMessage(){mewLocationMessage.textContent="";mewLocationMessage.style.display="none";}
 map.on("locationfound",e=>{mewClearLocationMessage();mewNearbyLocation=e.latlng;mewUpdateNearbyStatus();if(myLocationMarker)map.removeLayer(myLocationMarker);if(myLocationAccuracy)map.removeLayer(myLocationAccuracy);myLocationAccuracy=L.circle(e.latlng,{radius:e.accuracy,color:"#1769aa",weight:1,fillOpacity:.08,interactive:false}).addTo(map);myLocationMarker=L.circleMarker(e.latlng,{radius:9,color:"#fff",weight:3,fillColor:"#1769aa",fillOpacity:1}).addTo(map).bindPopup("Your current device location. This location is not saved by CoastWatch FL.");myLocationMarker.openPopup();const b=$("locateBtn");b.disabled=false;b.textContent="My location";});
 map.on("locationerror",e=>{const b=$("locateBtn");b.disabled=false;b.textContent="My location";const denied=e&&e.code===1;const timeout=e&&e.code===3;mewShowLocationMessage(denied?"Location permission is blocked. In your browser, open site settings for coastwatch-fl.pages.dev, set Location to Allow, then tap My Location again.":timeout?"Your device took too long to respond. Check that Location is turned on and try again.":"Your device location is unavailable. Check browser and device location settings, then try again.");});
const approvedPhotos={};
function reportStatusLabel(status){return status==="unverified"?"Unverified community report":status==="resolved"?"Marked resolved · not independently verified":"Previously admin-reviewed · not official verification"}
const mewFeedbackCounts=new Map();
function mewFeedbackControls(r,compact=false){const v=mewFeedbackCounts.get(r.id)||{still_there:0,no_longer_there:0};const threshold=r.severity==="critical"||["flooding","coastal_flooding","road_closure","erosion_washout"].includes(r.category)?5:3;return `<div class="mew-feedback" data-feedback-wrap="${r.id}"><div class="mew-feedback-counts"><span>👍 Still there: <b>${v.still_there}</b></span><span>👎 No longer there: <b>${v.no_longer_there}</b></span></div><div class="mew-feedback-actions"><button type="button" class="mew-feedback-btn" data-feedback-incident="${r.id}" data-feedback-vote="still_there">👍 Still there</button><button type="button" class="mew-feedback-btn secondary" data-feedback-incident="${r.id}" data-feedback-vote="no_longer_there">👎 No longer there</button></div><small>To remove a report: at least ${threshold} “No longer there” votes, and more than “Still there” votes. Community feedback is not official verification.</small></div>`}
function mewVoterToken(){let token=localStorage.getItem("coastwatch_feedback_token");if(!token){token=crypto.randomUUID();localStorage.setItem("coastwatch_feedback_token",token);}return token;}
async function submitCommunityFeedback(incidentId,vote,button){const wrap=button.closest("[data-feedback-wrap]");const buttons=wrap?.querySelectorAll("button")||[];buttons.forEach(b=>b.disabled=true);const original=button.textContent;button.textContent="Sending…";try{const {data,error}=await db.rpc("submit_public_incident_feedback",{p_incident_id:incidentId,p_voter_token:mewVoterToken(),p_vote:vote});if(error)throw error;const result=Array.isArray(data)?data[0]:data;await loadReports();if(wrap){const note=document.createElement("small");note.textContent="Thank you. Your feedback has been sent to CoastWatch moderators for review. The report remains visible until a moderator updates it.";note.style.cssText="display:block;margin-top:7px;color:#087f83;font-weight:700";wrap.appendChild(note);}}catch(error){console.warn("Community feedback failed:",error);alert(error.message||"Your feedback could not be submitted. Please try again.");if(wrap)wrap.querySelectorAll("button").forEach(b=>b.disabled=false);button.textContent=original;}}
document.addEventListener("click",e=>{const button=e.target.closest("[data-feedback-vote]");if(!button)return;submitCommunityFeedback(button.dataset.feedbackIncident,button.dataset.feedbackVote,button);});
function popup(r){const photo=approvedPhotos[r.id];const observed=String(r.description||"").trim();return `<div class="mew-community-popup"><div class="mew-popup-header"><strong class="mew-popup-title">${esc(r.title||r.category.replaceAll("_"," "))}</strong><button type="button" class="mew-popup-close" aria-label="Close report popup" title="Close">×</button></div><div>${esc(r.address||"")}</div><div>${esc(reportStatusLabel(r.status))}</div><div>${new Date(r.created_at).toLocaleString()}</div><small>User-submitted information. Not official verification.</small>${observed?`<div style="margin-top:9px;padding:9px 10px;background:#f1f5f9;color:#172b3d;border:1px solid #dbe5ee;border-radius:9px;white-space:pre-wrap;overflow-wrap:anywhere"><strong>What was observed</strong><br>${esc(observed)}</div>`:""}${photo?`<br><img src="${esc(photo)}" alt="Administrator-approved community photo" class="mew-photo-zoom" role="button" tabindex="0" aria-label="Enlarge community report photo" style="width:100%;max-width:220px;margin-top:8px;border-radius:8px">`:""}${mewFeedbackControls(r)}<br><button class="secondary mew-flag-btn" data-flag="${r.id}" style="margin-top:8px">Report this listing</button></div>`}

/* Public read-only CoastWatch FL zone overlay. RLS exposes active zones only. */
let mewPublicZoneLayer=L.featureGroup().addTo(map);
const mewPublicZoneBounds=new Map();
const mewPublicZoneEntries=new Map();
let mewPublicZonesLoading=null;
function mewZoneFeedbackMarkup(z,counts){
 const name=String(z.name||""),description=String(z.description||""),type=String(z.zone_type||"");
 const threshold=type==="danger"||type==="restricted"||/(flood|road closed|washout|closure|closed)/i.test(name+" "+description)?5:3;
 const still=Number(counts?.still_unsafe||0),safe=Number(counts?.safe_now||0);
 return `<div class="mew-zone-feedback" data-zone-feedback-wrap="${esc(z.id)}"><strong>Are conditions still unsafe here?</strong><div class="mew-zone-feedback-counts"><span>⚠️ Still unsafe: <b data-zone-unsafe-count>${still}</b></span><span>✓ Safe now: <b data-zone-safe-count>${safe}</b></span></div><div class="mew-zone-feedback-actions"><button type="button" data-zone-vote="still_unsafe" data-zone-id="${esc(z.id)}">⚠️ Still unsafe</button><button type="button" data-zone-vote="safe_now" data-zone-id="${esc(z.id)}">✓ Safe now</button></div><small>Community feedback is informational only. A zone stays on the public map until an administrator verifies the conditions and updates it.</small></div>`;
}
function mewZoneVoterToken(){let token=localStorage.getItem("coastwatch_zone_feedback_token");if(!token){token=crypto.randomUUID();localStorage.setItem("coastwatch_zone_feedback_token",token);}return token;}
document.addEventListener("click",async e=>{
 const button=e.target.closest("[data-zone-vote]");
 if(!button)return;
 const wrap=button.closest("[data-zone-feedback-wrap]");
 if(!wrap)return;
 const buttons=wrap.querySelectorAll("button[data-zone-vote]");
 buttons.forEach(b=>b.disabled=true);
 const original=button.textContent;
 button.textContent="Sending…";
 try{
  const {data,error}=await db.rpc("submit_public_map_zone_feedback",{p_zone_id:button.dataset.zoneId,p_voter_token:mewZoneVoterToken(),p_vote:button.dataset.zoneVote});
  if(error)throw error;
  const result=Array.isArray(data)?data[0]:data;
  if(!result)throw new Error("No feedback result was returned.");
  const unsafe=wrap.querySelector("[data-zone-unsafe-count]"),safe=wrap.querySelector("[data-zone-safe-count]");
  if(unsafe)unsafe.textContent=Number(result.still_unsafe||0);
  if(safe)safe.textContent=Number(result.safe_now||0);
  if(result.community_cleared){
   map.closePopup();
   await loadPublicZones();
   alert("An administrator has updated this zone.");
  }else{
   button.textContent="Vote recorded";
   buttons.forEach(b=>b.disabled=false);
  }
 }catch(error){
  console.warn("Map-zone feedback failed:",error);
  alert(error.message||"Your vote could not be submitted. Please try again.");
  buttons.forEach(b=>b.disabled=false);
  button.textContent=original;
 }
});
async function loadPublicZones(){
 // Never replace the active zone layers while a visitor is reading a map popup.
 // The periodic refresh will retry on its next cycle after the popup closes.
 if(map._popup&&map.hasLayer(map._popup))return false;
 if(mewPublicZonesLoading)return mewPublicZonesLoading;
 mewPublicZonesLoading=(async()=>{
  const {data,error}=await db.from("map_zones").select("id,name,description,zone_type,color,geometry").eq("active",true).order("created_at",{ascending:false});
  if(error){console.warn("CoastWatch FL zones unavailable:",error.message);const list=$("publicZoneList");if(list&&!list.children.length)list.innerHTML='<span class="map-zone-empty">Zone information is temporarily unavailable.</span>';return false;}
  const {data:feedbackRows,error:feedbackError}=await db.rpc("get_public_map_zone_feedback");
  if(feedbackError)console.warn("Map-zone feedback counts unavailable:",feedbackError.message);
  const feedbackByZone=new Map((feedbackRows||[]).map(row=>[String(row.zone_id),row]));
  let zones=(data||[]).filter(z=>z.geometry&&["Point","Polygon","MultiPolygon"].includes(z.geometry.type));
  // Pull the City's authoritative boil-water polygons. Active is a coded TEXT field
  // in this ArcGIS layer, so query broadly and filter the returned attributes client-side.
  try{
   const gisUrl="https://gis.palmbayflorida.org/arcgis/rest/services/BWN_Alert/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson";
   const gisResponse=await fetch(gisUrl,{headers:{Accept:"application/geo+json,application/json"}});
   if(!gisResponse.ok)throw new Error("Palm Bay GIS HTTP "+gisResponse.status);
   const gisData=await gisResponse.json();
   if(gisData.error)throw new Error(gisData.error.message||"Palm Bay GIS error");
   const activeFeatures=(gisData.features||[]).filter(f=>{
    const p=f.properties||{};
    return f.geometry&&["Polygon","MultiPolygon"].includes(f.geometry.type)&&String(p.Active||"").trim()==="1";
   });
   if(activeFeatures.length){
    zones=zones.filter(z=>z.id!=="f57b4978-a1cf-4a92-803a-f5eeb7fde5a8");
    activeFeatures.forEach((f,index)=>{
     const p=f.properties||{};
     const street=String(p.ST_Name||"Palm Bay affected area");
     const comments=String(p.Comments||"");
     zones.push({
      id:"palm-bay-bwn-gis-"+String(p.OBJECTID??index),
      name:"BOIL WATER NOTICE · "+street,
      description:"ACTIVE — Official City of Palm Bay Utilities GIS polygon. "+(comments?comments+" ":"")+"This blue shaded boundary is published by the City's Utilities EGIS Division. Check your exact address with Palm Bay Utilities before relying on the boundary.",
      zone_type:"caution",color:"#168BFF",geometry:f.geometry
     });
    });
   }
  }catch(gisError){console.warn("Palm Bay official boil-water GIS overlay unavailable; using saved map marker:",gisError);}
  // West Melbourne is included in the City of Melbourne wholesale supply area.
  // The City of Melbourne rescinded the notice for all water customers on Nov. 5, 2026,
  // and Brevard County confirmed the rescission in its 6:30 p.m. community report.
  // West Melbourne's boil-water notice was lifted with the City of Melbourne's
  // Nov. 5, 2026, all-customers rescission; West Melbourne is a wholesale customer.
  // Keep the warning inactive and remove the precautionary boundary overlay.


  const nextEntries=new Map(),nextBounds=new Map(),nextLayers=[];
  zones.forEach(z=>{
   const isPoint=z.geometry.type==="Point";
   let casing,bounds;
   if(isPoint){const c=z.geometry.coordinates;if(!Array.isArray(c)||c.length<2)return;const ll=L.latLng(c[1],c[0]);casing=L.circleMarker(ll,{radius:9,color:"#ffffff",weight:3,fillColor:z.color||"#ef3340",fillOpacity:.98});bounds=L.latLngBounds([ll,ll]).pad(.002);}
   else{const isBoilArea=/^BOIL WATER NOTICE/i.test(String(z.name||""));casing=L.geoJSON(z.geometry,{style:{color:isBoilArea?"#ffffff":"#ffffff",weight:6,opacity:.9,fillColor:z.color||"#ef3340",fillOpacity:isBoilArea?.16:.16,lineCap:"round",lineJoin:"round"}});bounds=casing.getBounds();}
   if(!bounds||!bounds.isValid())return;
   const rawDescription=String(z.description||"");
   const isUnverified=rawDescription.startsWith("UNVERIFIED:");
   const zoneType=String(z.zone_type||"zone").replaceAll("_"," ");
   const zoneNameUpper=String(z.name||"").toUpperCase();
   const isOpen=zoneNameUpper.startsWith("ROAD OPEN");
   const isRoadClosed=zoneNameUpper.startsWith("ROAD CLOSED")||zoneNameUpper.startsWith("ROAD WASHED OUT")||zoneNameUpper.startsWith("ROAD WORK");
   const isStatusUnknown=/^STATUS UNVERIFIED|^TRAFFIC SIGNAL STATUS UNVERIFIED/i.test(String(z.name||""));
   const isSignalOut=/traffic signal|traffic light/i.test(String(z.name||"")+" "+rawDescription);
   const isWashout=String(z.name||"").toLowerCase().includes("washout")||/washed out|washout/i.test(rawDescription);
   const isFlooded=/roadway flooded|outside lanes flooded|lanes flooded|flooded at|travel lanes underwater|standing water|water over (the )?roadway/i.test(rawDescription);
   const isPropertyDamage=/flood damage|property damage/i.test(String(z.name||"")+" "+rawDescription);
   const facilityStatus=(()=>{const n=String(z.name||"");if(/^COMMUNITY CENTER CLOSED/i.test(n))return "COMMUNITY CENTER CLOSED";if(/^SENIOR CENTER CLOSED/i.test(n))return "SENIOR CENTER CLOSED";if(/^PARK CLOSED/i.test(n))return "PARK CLOSED";if(/^DOG PARK CLOSED/i.test(n))return "DOG PARK CLOSED";if(/^BOAT RAMP CLOSED/i.test(n))return "BOAT RAMP CLOSED";if(/^TRAIL CLOSED/i.test(n))return "TRAIL CLOSED";if(/^DOCK \/ RAMP DAMAGE/i.test(n))return "DOCK / RAMP DAMAGE";if(/^ENTRANCE ROAD DAMAGED/i.test(n))return "ENTRANCE ROAD DAMAGED";return "";})();
   const situation=/^BOIL WATER NOTICE/i.test(String(z.name||""))?"BOIL WATER NOTICE":(facilityStatus||(isStatusUnknown?(isSignalOut?"SIGNAL STATUS UNVERIFIED":"ROAD STATUS UNVERIFIED"):(isPropertyDamage?"PROPERTY FLOOD DAMAGE":(isSignalOut?"TRAFFIC SIGNAL OUT":(isOpen?"ROAD OPEN":(isWashout?"ROAD WASHED OUT":(isFlooded?"ROAD FLOODED":(zoneType==="information"?"INFORMATION":"ROAD CLOSED"))))))));
   const displayStatus=isUnverified?situation+" · UNVERIFIED":situation;
   const openRoadCaution=isOpen?'<div class="mew-road-open-caution" role="note"><strong>⚠️ USE CAUTION</strong><br>This road is reported open, but standing water, debris, or changing conditions may still be present. Slow down and proceed carefully. Never drive through floodwater.</div>':"";
   const photoLinkMatch=rawDescription.match(/(?:^|\n)PHOTO_LINK:\s*(https:\/\/[^\s]+)/i);const photoLink=photoLinkMatch&&/^https:\/\//i.test(photoLinkMatch[1])?photoLinkMatch[1]:null;const photoLinkMarkup=photoLink?'<div class="mew-zone-photo-link"><a href="'+esc(photoLink)+'" target="_blank" rel="noopener noreferrer">View original report &amp; photos ↗</a></div>':"";const detailDescription=rawDescription.replace(/^UNVERIFIED:\s*/,"").replace(/(?:^|\n)PHOTO_LINK:\s*https:\/\/[^\s]+/i,"").trim();
   const sourceLabel=/City of Palm Bay/i.test(rawDescription)?"Official City of Palm Bay report · not independently verified by CoastWatch FL":/\bFHP\b|Florida Highway Patrol/i.test(rawDescription)?"Official FHP report · current conditions not independently verified":/City of Melbourne/i.test(rawDescription)?"Official City of Melbourne advisory · not independently verified by CoastWatch FL":/City of West Melbourne|West Melbourne Police/i.test(rawDescription)?"Official West Melbourne update · not independently verified by CoastWatch FL":/National Weather Service|\bNWS\b/i.test(rawDescription)?"Official NWS alert · not independently field-verified":/Brevard County/i.test(rawDescription)?"Official Brevard County update · not independently verified by CoastWatch FL":/WKMG|News 6|ClickOrlando|Hometown News|Palm Bayer|community report/i.test(rawDescription)?"Media/community report · not an official road confirmation":"Source-reported information · not independently verified by CoastWatch FL";
   const isBoilNotice=/^BOIL WATER NOTICE/i.test(String(z.name||""));
   const isLaneClosure=/^LANE CLOSURE/i.test(String(z.name||""));
   const isRoadClosure=/^ROAD CLOSED/i.test(String(z.name||""));const isFacilityClosed=/^COMMUNITY CENTER CLOSED|^SENIOR CENTER CLOSED/i.test(String(z.name||""));
   const color=isOpen?"#22c55e":isRoadClosed?"#dc2626":isLaneClosure?"#f59e0b":isStatusUnknown?"#94a3b8":(z.color||"#ef3340");
   if(isPoint)casing.setStyle({fillColor:color});
   const outline=isPoint?L.circleMarker(bounds.getCenter(),{radius:5,color,weight:2,fillColor:color,fillOpacity:.2}):L.geoJSON(z.geometry,{style:{color,weight:4,opacity:.88,fillColor:color,fillOpacity:.12,lineCap:"round",lineJoin:"round"}});
   const label=L.divIcon({className:"mew-zone-label-icon",html:'<span class="mew-zone-label'+(isBoilNotice?' mew-zone-label-boil':(isLaneClosure?' mew-zone-label-lane':((isRoadClosure||isFacilityClosed)?' mew-zone-label-closure':(isOpen?' mew-zone-label-open':''))))+'">'+(isBoilNotice?'<b>💧 BOIL WATER AREA</b><small>ACTIVE · '+(String(z.name||"").toUpperCase().includes("WEST MELBOURNE")?'WEST MELBOURNE':'PALM BAY')+'</small>':(isLaneClosure?'<b>🚧 LANE CLOSED</b><small>TRAFFIC HAZARD</small>':(isRoadClosure?'<b>⛔ ROAD CLOSED</b><small>DO NOT ENTER</small>':(isSignalOut?'<b>🚦 '+esc(situation)+'</b>':'<b>'+esc(situation)+'</b>')+'<small>'+(isUnverified?'UNVERIFIED':(isOpen?'USE CAUTION':'STATUS'))+'</small>')))+'</span>',iconSize:[1,1],iconAnchor:[0,0]});
   const labelMarker=L.marker(bounds.getCenter(),{icon:label,interactive:true,keyboard:true,zIndexOffset:1200,title:z.name||"Active map zone"});
   const group=L.featureGroup([casing,outline,labelMarker]);
   group.bindPopup('<strong class="mew-zone-popup-title">'+esc(z.name)+'</strong><br><span>'+esc(displayStatus)+'</span>'+openRoadCaution+(detailDescription?'<p>'+esc(detailDescription)+'</p>':'')+photoLinkMarkup+'<small>'+sourceLabel+'</small>'+mewZoneFeedbackMarkup(z,feedbackByZone.get(String(z.id))),{className:"mew-public-zone-popup"});
   nextEntries.set(String(z.id),{bounds,group,labelMarker,isBoilNotice,clusterColor:isBoilNotice?"#168BFF":(isOpen?"#22c55e":(isRoadClosed?"#dc2626":(isLaneClosure?"#f59e0b":(isRoadClosure?"#c81e1e":String(z.color||"#ef3340").toLowerCase()))))});
   nextBounds.set(String(z.id),bounds);
   nextLayers.push(group);
  });
  // A popup may have opened while the database request was in flight.
  // Leave the current layers untouched; the next scheduled refresh will retry.
  if(map._popup&&map.hasLayer(map._popup))return false;
  // Swap the map layer and lookup data only after the replacement data is fully prepared.
  mewPublicZoneLayer.clearLayers();
  mewPublicZoneEntries.clear();nextEntries.forEach((value,key)=>mewPublicZoneEntries.set(key,value));
  mewPublicZoneBounds.clear();nextBounds.forEach((value,key)=>mewPublicZoneBounds.set(key,value));
  mewRefreshPublicZoneClusters();
  mewRefreshZoneLabelVisibility();
  const list=$("publicZoneList"),count=$("mapZonesCount");
  if(count)count.textContent=nextEntries.size+(nextEntries.size===1?" zone":" zones");
  if(list){
   list.innerHTML=nextEntries.size?zones.filter(z=>nextEntries.has(String(z.id))).map(z=>{const d=String(z.description||"");const isOpen=String(z.name||"").toUpperCase().startsWith("ROAD OPEN");const wash=/washout|washed out/i.test(String(z.name||"")+" "+d);const flooded=/roadway flooded|outside lanes flooded|lanes flooded|flooded at|travel lanes underwater|standing water|water over (the )?roadway/i.test(d);const n=String(z.name||"");const facility=(()=>{if(/^COMMUNITY CENTER CLOSED/i.test(n))return "Community center closed";if(/^SENIOR CENTER CLOSED/i.test(n))return "Senior center closed";if(/^PARK CLOSED/i.test(n))return "Park closed";if(/^TRAIL CLOSED/i.test(n))return "Trail closed";if(/^DOCK \/ RAMP DAMAGE/i.test(n))return "Dock / ramp damage";if(/^ENTRANCE ROAD DAMAGED/i.test(n))return "Entrance road damaged";if(/^BOAT RAMP CLOSED/i.test(n))return "Boat ramp closed";if(/^DOG PARK CLOSED/i.test(n))return "Dog park closed";return "";})();const unknown=/^STATUS UNVERIFIED|^TRAFFIC SIGNAL STATUS UNVERIFIED/i.test(n);const status=facility||(unknown?"Status unverified":(isOpen?"Road open":(wash?"Road washed out":(flooded?"Road flooded":(String(z.zone_type||"")==="information"?"Road status":"Road closed")))));const source=/City of Palm Bay/i.test(d)?"Palm Bay city report · not CoastWatch-verified":/\bFHP\b|Florida Highway Patrol/i.test(d)?"FHP report · unverified":/City of Melbourne/i.test(d)?"City report · not CoastWatch-verified":/City of West Melbourne|West Melbourne Police/i.test(d)?"West Melbourne report · not CoastWatch-verified":/National Weather Service|\bNWS\b/i.test(d)?"NWS alert · not field-verified":/Brevard County/i.test(d)?"County report · not CoastWatch-verified":/WKMG|News 6|ClickOrlando|Hometown News|Palm Bayer|community report/i.test(d)?"Media/community report · not official":"Unverified";return '<button type="button" class="map-zone-item" data-zone-focus="'+esc(z.id)+'"><i style="--zone-color:'+esc(isOpen?"#22c55e":unknown?"#94a3b8":(z.color||"#ef3340"))+'"></i><span>'+esc(z.name||"Designated zone")+'</span><small>'+status+(isOpen?' · Use caution':'')+' · '+source+'</small><small>View</small></button>'}).join(""):'<span class="map-zone-empty">No active designated zones right now.</span>';
   mewBindPublicZoneButtons();
  }
  return true;
 })().finally(()=>{mewPublicZonesLoading=null;});
 return mewPublicZonesLoading;
}
function mewRefreshPublicZoneClusters(){
 if(!mewPublicZoneLayer)return;
 mewPublicZoneLayer.clearLayers();
 const entries=[...mewPublicZoneEntries.values()];
 // Always render every real hazard marker/shape. Clusters are supplemental
 // counters, never replacements for the underlying zones.
 entries.forEach(entry=>entry.group.addTo(mewPublicZoneLayer));
 const clusterZoom=window.matchMedia("(max-width:700px)").matches?13:12;
 if(map.getZoom()>=clusterZoom)return;
 const colorGroups=new Map();
 entries.filter(entry=>!entry.isBoilNotice).forEach(entry=>{
  const color=entry.clusterColor||"#ef3340";
  if(!colorGroups.has(color))colorGroups.set(color,[]);
  colorGroups.get(color).push(entry);
 });
 colorGroups.forEach((matchingEntries,color)=>{
  const items=matchingEntries.map(entry=>({latlng:entry.bounds.getCenter(),layer:entry.group,bounds:entry.bounds}));
  mewGroupNearby(items,68).forEach(group=>{
   if(group.items.length>1){
    const kind=color==="#22c55e"||color==="#2e8b57"?"open":(color==="#f59e0b"?"caution":(color==="#c81e1e"||color==="#dc2626"||color==="#c83b35"?"closure":"zone"));
    mewMakeCountCluster(group.items.length,group.bounds.getCenter(),group.bounds,kind,color).addTo(mewPublicZoneLayer);
   }
  });
 });
}
// Auto-pan on popup open emits moveend. Rebuilding clustered layers during that
// movement removes the clicked feature and makes its popup disappear. Defer cluster
// changes until no popup is open, then refresh once the visitor closes it.
map.on("zoomend",mewRefreshPublicZoneClusters);
map.on("moveend",()=>{if(!map._popup)mewRefreshPublicZoneClusters();});
map.on("popupclose",()=>requestAnimationFrame(()=>{if(!map._popup)mewRefreshPublicZoneClusters();}));
function mewRefreshZoneLabelVisibility(){
 const zoom=map.getZoom(),mobile=window.matchMedia("(max-width:700px)").matches;
 const minZoom=mobile?13:12;
 const showAll=zoom>=minZoom;
 mewPublicZoneEntries.forEach(entry=>{
  if(!entry.labelMarker||!entry.group)return;
  const shouldShow=showAll||entry.isBoilNotice;
  const hasLabel=entry.group.hasLayer(entry.labelMarker);
  if(shouldShow&&!hasLabel)entry.group.addLayer(entry.labelMarker);
  else if(!shouldShow&&hasLabel)entry.group.removeLayer(entry.labelMarker);
 });
}
map.on("zoomend moveend",mewRefreshZoneLabelVisibility);
const mapZonesToggle=document.getElementById("mapZonesToggle");
if(mapZonesToggle){
 const zonesCard=document.getElementById("mapZonesCard");
 const collapsedByDefault=window.matchMedia("(max-width: 700px)").matches;
 if(collapsedByDefault){zonesCard.classList.add("is-collapsed");mapZonesToggle.textContent="Show list";mapZonesToggle.setAttribute("aria-expanded","false");}
 mapZonesToggle.addEventListener("click",()=>{
  const collapsed=zonesCard.classList.toggle("is-collapsed");
  mapZonesToggle.textContent=collapsed?"Show list":"Hide list";
  mapZonesToggle.setAttribute("aria-expanded",String(!collapsed));
 });
}
function mewFocusPublicZone(id,button){
 const key=String(id);
 let entry=mewPublicZoneEntries.get(key);
 if(!entry){
  // A scheduled refresh may be in flight; wait for it rather than disabling a valid zone.
  if(button){button.disabled=true;button.setAttribute("aria-busy","true");}
  loadPublicZones().then(()=>{
   entry=mewPublicZoneEntries.get(key);
   if(entry)mewFocusPublicZone(key,button);
   else if(button){button.disabled=false;button.removeAttribute("aria-busy");}
  }).catch(error=>{console.warn("Could not refresh CoastWatch zone data:",error);if(button){button.disabled=false;button.removeAttribute("aria-busy");}});
  return;
 }
 if(!entry.bounds||!entry.bounds.isValid())return;
 if(button){button.disabled=true;button.setAttribute("aria-busy","true");}
 map.stop();
 map.closePopup();
 map.fitBounds(entry.bounds,{paddingTopLeft:[55,75],paddingBottomRight:[55,75],maxZoom:14,animate:true,duration:.7});
 map.once("moveend",()=>{
  entry.group.openPopup(entry.bounds.getCenter());
  if(button){button.disabled=false;button.removeAttribute("aria-busy");}
 });
}
function mewBindPublicZoneButtons(){
 const list=$("publicZoneList");
 if(!list)return;
 list.querySelectorAll("[data-zone-focus]").forEach(button=>{
  if(button.dataset.zoneBound==="true")return;
  button.dataset.zoneBound="true";
  button.addEventListener("click",event=>{
   event.preventDefault();
   event.stopPropagation();
   mewFocusPublicZone(button.dataset.zoneFocus,button);
  },{capture:true});
 });
}

async function loadReports(){if(map._popup&&map.hasLayer(map._popup))return;const {data,error}=await db.from("incidents").select("id,category,title,description,latitude,longitude,address,severity,status,created_at,expires_at").in("category",categories).in("status",["unverified","confirmed","resolved"]).order("created_at",{ascending:false}).limit(250);if(error){console.error("CoastWatch FL public report query failed:",{message:error.message,code:error.code,details:error.details,hint:error.hint});$("latestReports").innerHTML='<div class="status error">Reports are temporarily unavailable.<br><small>'+esc(error.message)+' · '+esc(error.code||"no error code")+'</small></div>';$("countLabel").textContent="Unavailable";markers.forEach(m=>map.removeLayer(m));markers=[];return}
if(map._popup&&map.hasLayer(map._popup))return;window.mewReports=data||[];mewUpdateNearbyStatus();mewFeedbackCounts.clear();const {data:feedbackRows,error:feedbackError}=await db.rpc("get_public_incident_feedback");if(feedbackError)console.warn("Community feedback counts unavailable:",feedbackError.message);(feedbackRows||[]).forEach(row=>mewFeedbackCounts.set(row.incident_id,{still_there:Number(row.still_there)||0,no_longer_there:Number(row.no_longer_there)||0}));markers.forEach(m=>map.removeLayer(m));markers=[];photoBubbleMarkers.forEach(m=>map.removeLayer(m));photoBubbleMarkers=[];Object.keys(approvedPhotos).forEach(k=>delete approvedPhotos[k]);if(data.length){const {data:photoRows}=await db.from("incident_photos").select("incident_id,storage_path").eq("status","approved").in("incident_id",data.map(r=>r.id));for(const photo of (photoRows||[])){const {data:signed}=await db.storage.from("incident-photos").createSignedUrl(photo.storage_path,300);if(signed?.signedUrl)approvedPhotos[photo.incident_id]=signed.signedUrl;}}$("countLabel").textContent=data.length+(data.length===1?" report":" reports");
$("latestReports").innerHTML=data.slice(0,12).map(r=>`<div class="report"><strong>${esc(r.title||r.category.replaceAll("_"," "))}</strong><small>${esc(r.address||"Location on map")} · ${new Date(r.created_at).toLocaleString()}</small>${String(r.description||"").trim()?`<p class="report-description">${esc(r.description)}</p>`:""}<div><span class="pill">${reportStatusLabel(r.status)}</span></div>${approvedPhotos[r.id]?`<img src="${esc(approvedPhotos[r.id])}" alt="Administrator-approved community photo" class="mew-photo-zoom" role="button" tabindex="0" aria-label="Enlarge community report photo" style="width:100%;max-width:220px;max-height:120px;object-fit:cover;border-radius:8px;margin-top:8px">`:""}${Number.isFinite(+r.latitude)&&Number.isFinite(+r.longitude)?`<button type="button" class="secondary mew-view-report-map" data-report-map="${esc(r.id)}" style="margin-top:9px;padding:9px 12px;font-size:14px">View on map</button>`:""}<button class="secondary mew-flag-btn" data-flag="${r.id}" style="margin-top:9px;padding:9px 12px;font-size:14px">Report this listing</button></div>`).join("")||'<p class="hint">No community reports yet.</p>';
data.forEach(r=>{if((mapFilter==="all"||r.category===mapFilter)&&Number.isFinite(+r.latitude)&&Number.isFinite(+r.longitude)){const color=r.status==="resolved"?"#64748b":r.status==="unverified"?"#0f766e":"#15803d";const latlng=[r.latitude,r.longitude];const m=L.circleMarker(latlng,{radius:11,color:"#ffffff",opacity:1,weight:2.5,fillColor:color,fillOpacity:1}).addTo(map).bindPopup(popup(r),{maxWidth:Math.min(340,Math.max(240,window.innerWidth-76)),maxHeight:Math.max(220,Math.floor(window.innerHeight*.52)),offset:L.point(0,0),autoPan:true,autoPanPaddingTopLeft:[18,85],autoPanPaddingBottomRight:[18,85],closeButton:false,keepInView:true,className:"mew-community-leaflet-popup"});m._mewIncidentId=r.id;markers.push(m);if(approvedPhotos[r.id]){const photoMarkup=`<span class="mew-photo-bubble"><img src="${esc(approvedPhotos[r.id])}" alt="Report photo preview"><span class="mew-photo-bubble-tail"></span></span>`;const bubble=L.marker(latlng,{keyboard:true,title:"Open report photo and details",icon:L.divIcon({className:"mew-photo-bubble-icon",html:photoMarkup,iconSize:[90,78],iconAnchor:[45,78]})}).addTo(map);bubble.on("click",()=>{m.openPopup();});const previewImage=bubble.getElement()?.querySelector("img");if(previewImage){const fitOrientation=()=>{if(previewImage.naturalHeight>previewImage.naturalWidth){bubble.setIcon(L.divIcon({className:"mew-photo-bubble-icon mew-photo-bubble-icon-portrait",html:photoMarkup.replace('mew-photo-bubble"','mew-photo-bubble mew-photo-bubble-portrait"'),iconSize:[64,110],iconAnchor:[32,110]}));}};if(previewImage.complete)fitOrientation();else previewImage.addEventListener("load",fitOrientation,{once:true});}photoBubbleMarkers.push(bubble);}}});applySourceFilter();}

document.addEventListener("click",e=>{if(e.target.closest(".mew-popup-close")){e.preventDefault();map.closePopup();}});
document.addEventListener("click",async e=>{
 const button=e.target.closest("[data-report-map]");
 if(!button)return;
 const id=button.dataset.reportMap;
 button.disabled=true;
 const original=button.textContent;
 button.textContent="Opening map…";
 try{
  mapFilter="all";sourceMode="community";applySourceFilter();
  let marker=markers.find(item=>item._mewIncidentId===id);
  if(!marker){await loadReports();marker=markers.find(item=>item._mewIncidentId===id);}
  if(!marker)throw new Error("This report's map marker is currently unavailable. Please refresh and try again.");
  document.getElementById("map-panel")?.scrollIntoView({behavior:"smooth",block:"start"});
  mewUnlockMap();
  window.setTimeout(()=>{map.invalidateSize({pan:false});map.setView(marker.getLatLng(),16,{animate:true});marker.openPopup();},220);
 }catch(error){console.warn("Could not open community report on map:",error);alert(error.message||"Could not open this report on the map.");}
 finally{button.disabled=false;button.textContent=original;}
});
let mewFlagIncidentId=null,mewFlagSourceButton=null;
const flagOverlay=document.getElementById("flagOverlay"),flagForm=document.getElementById("flagForm");
function closeFlagDialog(){flagOverlay.classList.remove("open");flagForm.reset();document.getElementById("flagError").classList.add("hidden");mewFlagIncidentId=null;mewFlagSourceButton=null}
document.addEventListener("click",e=>{const b=e.target.closest("[data-flag]");if(!b)return;mewFlagIncidentId=b.dataset.flag;mewFlagSourceButton=b;flagOverlay.classList.add("open");});
document.getElementById("cancelFlag").addEventListener("click",closeFlagDialog);
flagOverlay.addEventListener("click",e=>{if(e.target===flagOverlay)closeFlagDialog()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&flagOverlay.classList.contains("open"))closeFlagDialog()});
flagForm.addEventListener("submit",async e=>{
 e.preventDefault();
 const selected=[...flagForm.querySelectorAll('input[name="flagReason"]:checked')].map(x=>x.value);
 const errorBox=document.getElementById("flagError"),submit=document.getElementById("submitFlag");
 errorBox.classList.add("hidden");
 if(!selected.length){errorBox.textContent="Please select at least one reason.";errorBox.classList.remove("hidden");return}
 submit.disabled=true;submit.textContent="Sending…";
 const details=document.getElementById("flagDetails").value.trim()||null;
 const rows=selected.map(reason=>({incident_id:mewFlagIncidentId,reason,details,status:"pending"}));
 const {error}=await db.from("incident_flags").insert(rows);
 if(error){console.error("CoastWatch FL flag submission failed:",error);errorBox.textContent="Your report could not be sent. Please try again.";errorBox.classList.remove("hidden");submit.disabled=false;submit.textContent="Submit report";return}
 if(mewFlagSourceButton){mewFlagSourceButton.disabled=true;mewFlagSourceButton.textContent="Report submitted"}
 closeFlagDialog();
 alert("Thank you. Your report has been sent to CoastWatch FL moderators for review.");
 submit.disabled=false;submit.textContent="Submit report";
});


async function jpegBlob(file){if(file.size>5*1024*1024)throw new Error("Each photo must be 5 MB or smaller.");const img=await createImageBitmap(file);const scale=Math.min(1,2000/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext("2d").drawImage(img,0,0,c.width,c.height);return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error("Image conversion failed")),"image/jpeg",.86))}
const photoRulesPanel=$("photoRules");if(photoRulesPanel)photoRulesPanel.open=false;
$("photos").addEventListener("change",()=>{const files=$("photos").files;const hasPhotos=files.length>0;$("photoRulesAck").disabled=!hasPhotos;if(!hasPhotos)$("photoRulesAck").checked=false;$("photosFileName").textContent=hasPhotos?(files.length+" image"+(files.length===1?"":"s")+" selected"):"No images chosen";});
$("reportForm").onsubmit=async e=>{e.preventDefault();const btn=$("submitBtn");btn.disabled=true;message("Submitting report…");try{
const lat=Number($("latitude").value),lng=Number($("longitude").value);if(!$("latitude").value||!$("longitude").value)throw new Error("Choose the hazard location on the map first.");if(lat<27.5||lat>29||lng< -81.5||lng> -80.2)throw new Error("Location must be within the current CoastWatch FL service area.");
const files=Array.from($("photos").files||[]);if(files.length>3)throw new Error("Choose no more than three photos.");const categoryNow=$("category").value;const recentDuplicate=(window.mewReports||[]).find(r=>r.category===categoryNow&&Date.now()-new Date(r.created_at).getTime()<12*60*60*1000&&Math.hypot((Number(r.latitude)-lat)*111,(Number(r.longitude)-lng)*85)<1);if(recentDuplicate&&!confirm("A similar community report was submitted nearby in the last 12 hours. Submit another anyway?"))throw new Error("Submission cancelled to avoid a duplicate report.");if(files.length&&!$("photoRulesAck").checked)throw new Error("Please confirm the photo upload rules before submitting images.");
// This public form intentionally submits as anon. The database RLS policy permits
// pending submissions with reporter_id NULL; administrator authentication is isolated
// to admin.html and is never restored into this public visitor client.
const reporterId=null;
const payload={category:$("category").value,title:$("category").selectedOptions[0].text,description:$("description").value.trim(),latitude:lat,longitude:lng,severity:$("severity").value,status:"unverified",anonymous:$("anonymous").checked,display_name:$("anonymous").checked?null:($("displayName").value.trim()||null),reporter_id:reporterId};
if(!categories.includes(payload.category)||!payload.description)throw new Error("Complete the required fields.");
const {data:created,error}=await db.rpc("submit_public_incident_with_photo_token",{p_payload:payload});if(error)throw error;const inserted=Array.isArray(created)?created[0]:created;if(!inserted?.incident_id||!inserted?.upload_token)throw new Error("The report upload authorization could not be created.");
for(const f of files){const blob=await jpegBlob(f);const path=`${inserted.incident_id}/${crypto.randomUUID()}.jpg`;const {error:upErr}=await db.storage.from("incident-photos").upload(path,blob,{contentType:"image/jpeg",upsert:false,metadata:{mew_upload_token:inserted.upload_token}});if(upErr)throw upErr;const {error:metaErr}=await db.from("incident_photos").insert({incident_id:inserted.incident_id,storage_path:path,status:"pending"});if(metaErr)throw metaErr}
message(files.length?"Your report is now public as an unverified community report. Any photos remain private until an administrator reviews them.":"Your report is now public as an unverified community report.","good");e.target.reset();$("latitude").value="";$("longitude").value="";$("locationConfirmation").textContent="No location selected yet. Choose a point on the map to continue.";$("mapReportBtn").textContent="＋ Report a hazard";$("mapReportHint").textContent="Select a location directly on the map";if(selectedLocationMarker){map.removeLayer(selectedLocationMarker);selectedLocationMarker=null;}await loadReports()
}catch(err){message("Could not submit report: "+err.message,"error")}finally{btn.disabled=false}};
$("sourceFilter").addEventListener("change",e=>{sourceMode=e.target.value;applySourceFilter()});
$("mapFilter").addEventListener("change",e=>{mapFilter=e.target.value;loadReports()});

// Full-size viewer for administrator-approved community report photos.
function openMewPhoto(src,alt){if(!src)return;const viewer=$("photoViewer"),image=$("photoViewerImage");image.src=src;image.alt=alt||"Enlarged community report photo";viewer.classList.add("open");document.body.style.overflow="hidden";$("photoViewerClose").focus();}
function closeMewPhoto(){const viewer=$("photoViewer");viewer.classList.remove("open");$("photoViewerImage").removeAttribute("src");document.body.style.overflow="";}
document.addEventListener("click",e=>{const photo=e.target.closest("img.mew-photo-zoom");if(photo){e.preventDefault();openMewPhoto(photo.currentSrc||photo.src,photo.alt);return;}if(e.target.id==="photoViewer"||e.target.id==="photoViewerClose")closeMewPhoto();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("photoViewer").classList.contains("open"))closeMewPhoto();if((e.key==="Enter"||e.key===" ")&&e.target.matches("img.mew-photo-zoom")){e.preventDefault();openMewPhoto(e.target.currentSrc||e.target.src,e.target.alt);}});
loadReports();loadPublicZones();loadPowerOutages();loadPowerOutageAreas();loadUSGSWaterLevels();loadNoaaTideLevel();loadEvacuationZones();loadShelters();setInterval(loadShelters,300000);setInterval(loadReports,45000);setInterval(loadPublicZones,60000);setInterval(loadPowerOutages,300000);setInterval(loadPowerOutageAreas,300000);setInterval(loadUSGSWaterLevels,900000);setInterval(loadNoaaTideLevel,900000);setInterval(loadEvacuationZones,3600000);
loadNwsAlerts();setInterval(loadNwsAlerts,60000);

// Align the report action with the actual map canvas on small screens.
// The basemap toolbar can wrap to multiple rows, so measure the map's real top edge.
(function mewPositionMobileReportTools(){
 const stage=document.querySelector("#map-panel .map-stage");
 const canvas=document.getElementById("map");
 const tools=document.querySelector("#map-panel .map-report-tools");
 if(!stage||!canvas||!tools)return;
 const update=()=>{
  if(!window.matchMedia("(max-width:700px)").matches){
   stage.style.removeProperty("--mew-map-canvas-top");
   return;
  }
  const stageRect=stage.getBoundingClientRect();
  const mapRect=canvas.getBoundingClientRect();
  const offset=Math.max(0,mapRect.top-stageRect.top);
  stage.style.setProperty("--mew-map-canvas-top",(offset+10)+"px");
 };
 update();
 window.addEventListener("resize",update,{passive:true});
 if("ResizeObserver" in window){
  const observer=new ResizeObserver(update);
  observer.observe(stage);
  observer.observe(canvas);
  const toolbar=document.getElementById("mapBasemapCard");
  if(toolbar)observer.observe(toolbar);
 }
 requestAnimationFrame(()=>requestAnimationFrame(update));
})();

syncShelterToggle();
applySourceFilter();
// Check for newly deployed public-page updates every 3 minutes.
// Do not reload while a visitor is entering a report or has unsaved form data.
let mewPageCheckBusy=false;
async function checkForSiteUpdates(){
 if(mewPageCheckBusy||document.visibilityState!=="visible")return;
 const form=$("reportForm");
 if(form&&(form.contains(document.activeElement)||new FormData(form).entries().next().done===false))return;
 mewPageCheckBusy=true;
 try{
  const response=await fetch(window.location.pathname+"?mew-version-check="+Date.now(),{method:"GET",cache:"no-store",headers:{"Cache-Control":"no-cache"}});
  if(!response.ok)return;
  const html=await response.text();
  const marker="CoastWatch FL_SITE_BUILD";
  const current=document.querySelector('meta[name="mew-build"]')?.content||"";
  const match=html.match(/<meta name=["']mew-build["'] content=["']([^"']+)["']/i);
  const latest=match?.[1];
  if(latest&&latest!==current)window.location.reload();
 }catch(err){console.debug("CoastWatch FL update check skipped:",err)}
 finally{mewPageCheckBusy=false}
}
setInterval(checkForSiteUpdates,180000);

/* Keep Active Map Zones over the map; move secondary resource cards below it on desktop only. */
(()=>{
 const panel=document.getElementById("map-panel");
 const stage=panel?.querySelector(".map-stage");
 const heading=panel?.querySelector(".map-workspace-head");
 const dashboard=panel?.querySelector(".map-dashboard");
 const sidebar=panel?.querySelector(".map-sidebar");
 const advanced=document.getElementById("mapAdvancedControls");
 const zones=document.getElementById("mapZonesCard");
 const resourceIds=["mewMapResourceDetails"];
 if(!panel||!stage||!heading||!dashboard||!sidebar||!zones||!advanced)return;
 let strip=stage.querySelector("#map-resource-strip");
 if(!strip){
  strip=document.createElement("div");
  strip.id="map-resource-strip";
  strip.setAttribute("aria-label","Additional emergency resources");
 }
 const desktop=window.matchMedia("(min-width: 901px)");
 const arrange=()=>{
  if(desktop.matches){
   if(heading.nextElementSibling!==advanced)panel.insertBefore(heading,advanced);
   if(advanced.parentElement!==panel||advanced.nextElementSibling!==dashboard)panel.insertBefore(advanced,dashboard);
   if(stage.parentElement!==dashboard)dashboard.appendChild(stage);
   if(zones.parentElement!==stage)stage.appendChild(zones);
   if(strip.parentElement!==dashboard)dashboard.appendChild(strip);
   resourceIds.forEach(id=>{const card=document.getElementById(id);if(card&&card.parentElement!==strip)strip.appendChild(card);});
  }else{
   if(heading.parentElement!==panel)panel.insertBefore(heading,dashboard);
   if(advanced.parentElement!==panel||advanced.previousElementSibling!==heading)panel.insertBefore(advanced,heading.nextElementSibling);
   if(stage.parentElement!==panel||stage.previousElementSibling!==advanced)panel.insertBefore(stage,advanced.nextElementSibling);
   if(dashboard.parentElement!==panel)panel.appendChild(dashboard);
   if(strip.parentElement)strip.remove();
   resourceIds.forEach(id=>{const card=document.getElementById(id);if(card&&card.parentElement!==sidebar)sidebar.appendChild(card);});
   if(zones.parentElement!==stage)stage.appendChild(zones);
   const legendToggle=document.getElementById("mobileLegendToggle");
   const legend=document.getElementById("nwsLegend");
   if(legendToggle&&legendToggle.parentElement!==panel)panel.insertBefore(legendToggle,dashboard);
   if(legend&&legend.parentElement!==panel)panel.insertBefore(legend,dashboard);
  }
  requestAnimationFrame(()=>map.invalidateSize({pan:false}));
 };
 arrange();
 if(desktop.addEventListener)desktop.addEventListener("change",arrange);
 else desktop.addListener(arrange);
})();



;

/* Reliable CoastWatch FL partner-ad rotation with working slide indicators. */
(function(){
 const init=()=>{
  const root=document.getElementById('community-partner-ads');
  if(!root||root.dataset.carouselReady==='true')return;
  const slides=Array.from(root.querySelectorAll('.cw-ad-slide'));
  const dots=Array.from(root.querySelectorAll('.cw-ad-progress i'));
  if(slides.length<2)return;
  root.dataset.carouselReady='true';
  let current=Math.max(0,slides.findIndex(s=>s.classList.contains('is-active')));
  let timer=null;
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(index){
   current=(index+slides.length)%slides.length;
   slides.forEach((slide,i)=>{
    const active=i===current;
    slide.classList.toggle('is-active',active);
    slide.setAttribute('aria-hidden',String(!active));
   });
   dots.forEach((dot,i)=>{
    const active=i===current;
    dot.classList.toggle('is-active',active);
    dot.setAttribute('role','button');
    dot.setAttribute('tabindex','0');
    dot.setAttribute('aria-label','Show advertisement '+(i+1));
    dot.setAttribute('aria-current',String(active));
   });
  }
  function stop(){if(timer!==null){window.clearInterval(timer);timer=null;}}
  function start(){stop();if(!document.hidden)timer=window.setInterval(()=>show(current+1),5000);}
  dots.forEach((dot,i)=>{
   dot.style.cursor='pointer';
   dot.addEventListener('click',()=>{show(i);start();});
   dot.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();show(i);start();}
   });
  });
  /* Do not pause on hover: the desktop banner must keep rotating. */
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  show(current);
  start();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
;
(function(){var d=document.getElementById("mapAdvancedControls");if(d&&window.matchMedia&&window.matchMedia("(max-width: 700px)").matches)d.open=false;})();
;

(()=> {
 const dialog=document.getElementById("mewGestureTutorial");
 const openButton=document.getElementById("mewGestureHelp");
 const closeButton=document.getElementById("mewGestureClose");
 const doneButton=document.getElementById("mewGestureGotIt");
 if(!dialog||!openButton||!closeButton||!doneButton)return;
 let lastFocus=null;
 const open=()=>{
  lastFocus=document.activeElement;
  dialog.hidden=false;
  document.body.style.overflow="hidden";
  closeButton.focus();
 };
 const close=()=>{
  dialog.hidden=true;
  document.body.style.overflow="";
  try{localStorage.setItem("coastwatch-map-gesture-guide-seen-v2","1")}catch(e){}
  if(lastFocus&&lastFocus.isConnected)lastFocus.focus();
 };
 openButton.addEventListener("click",open);
 closeButton.addEventListener("click",close);
 doneButton.addEventListener("click",close);
 dialog.addEventListener("click",e=>{if(e.target===dialog)close()});
 document.addEventListener("keydown",e=>{
  if(dialog.hidden)return;
  if(e.key==="Escape"){close();return}
  if(e.key==="Tab"){
   const items=[...dialog.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')];
   if(!items.length)return;
   if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus()}
   else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus()}
  }
 });
 // The guide is now opened only when a visitor taps the help button.
})();

;

(()=>{
 const link=document.querySelector('.mew-safety-main a[href="#safety-details"]');
 const details=document.getElementById("safety-details");
 if(!link||!details)return;
 link.addEventListener("click",event=>{
  event.preventDefault();
  details.open=!details.open;
  link.setAttribute("aria-expanded",String(details.open));
  // Keep the visitor at the safety notice; expanding content must not jump the page.
 });
 link.setAttribute("aria-controls","safety-details");
 link.setAttribute("aria-expanded",String(details.open));
})();

;

(()=>{
 const root=document.getElementById("mew-home-quick-actions");
 if(!root)return;
 const goTo=id=>{
  const target=document.getElementById(id);
  if(!target)return;
  target.scrollIntoView({behavior:"smooth",block:"start"});
 };
 root.addEventListener("click",event=>{
  const button=event.target.closest("button[data-mew-action]");
  if(!button)return;
  const action=button.dataset.mewAction;
  if(action==="location"){
   document.getElementById("locateBtn")?.click();
   goTo("map-panel");
  }else if(action==="shelters"){
   const toggle=document.getElementById("shelterToggleBtn");
   if(toggle&&toggle.getAttribute("aria-pressed")!=="true")toggle.click();
   const source=document.getElementById("sourceFilter");
   if(source){source.value="shelters";source.dispatchEvent(new Event("change",{bubbles:true}))}
   goTo("map-panel");
  }else if(action==="alerts"){
   goTo("official-alerts-panel");
  }else if(action==="report"){
   goTo("report-panel");
   window.setTimeout(()=>document.getElementById("category")?.focus({preventScroll:true}),450);
  }
 });
})();

;

(()=>{
 const strip=document.getElementById("mew-emergency-status-strip");
 if(!strip)return;
 const sources={
  alerts:()=>{const el=document.getElementById("nwsAlertStatus");const t=el?.textContent?.trim()||"";const m=t.match(/(\d+)\s+active/i);return m?m[1]+" active":(t.toLowerCase().includes("no active")?"None active":"Checking…")},
  shelters:()=>{const t=document.getElementById("shelterCount")?.textContent?.trim()||"";return t||"Checking…"},
  outages:()=>{const t=document.getElementById("powerOutageCount")?.textContent?.trim()||"";return t||"Checking…"},
  reports:()=>{const t=document.getElementById("countLabel")?.textContent?.trim()||"";return t||"Checking…"}
 };
 const refresh=()=>Object.entries(sources).forEach(([key,get])=>{const target=strip.querySelector('[data-status="'+key+'"] strong');if(target){const value=get();target.textContent=value;target.title=value}});
 refresh();
 ["nwsAlertStatus","shelterCount","powerOutageCount","countLabel"].forEach(id=>{const el=document.getElementById(id);if(el)new MutationObserver(refresh).observe(el,{childList:true,subtree:true,characterData:true,attributes:true})});
 setTimeout(refresh,500);setTimeout(refresh,1800);
})();

;

(()=>{
 const mq=window.matchMedia("(min-width:901px)");
 const panel=document.getElementById("map-panel");
 const dashboard=panel?.querySelector(":scope > .map-dashboard");
 const sidebar=dashboard?.querySelector(":scope > .map-sidebar");
 const stage=panel?.querySelector(":scope > .map-stage");
 const advanced=document.getElementById("mapAdvancedControls");
 const resources=document.getElementById("mewMapResourceDetails");
 const map=stage?.querySelector("#map");
 if(!panel||!dashboard||!sidebar||!stage||!advanced||!resources||!map)return;
 const original={stageParent:stage.parentNode,stageNext:stage.nextSibling,advancedParent:advanced.parentNode,advancedNext:advanced.nextSibling,resourcesParent:resources.parentNode,resourcesNext:resources.nextSibling,resourcesOpen:resources.open,advancedOpen:advanced.open};
 function layout(){
  if(mq.matches){
   sidebar.appendChild(advanced);
   advanced.open=true;
   stage.appendChild(resources);
   resources.open=true;
   dashboard.appendChild(stage);
   if(window.L&&window.mewMap&&typeof window.mewMap.invalidateSize==="function")requestAnimationFrame(()=>window.mewMap.invalidateSize());
  }else{
   if(original.resourcesParent)original.resourcesParent.insertBefore(resources,original.resourcesNext);
   resources.open=original.resourcesOpen;
   if(original.stageParent)original.stageParent.insertBefore(stage,original.stageNext);
   if(original.advancedParent)original.advancedParent.insertBefore(advanced,original.advancedNext);
   advanced.open=original.advancedOpen;
   if(window.L&&window.mewMap&&typeof window.mewMap.invalidateSize==="function")requestAnimationFrame(()=>window.mewMap.invalidateSize());
  }
 }
 layout();
 mq.addEventListener?mq.addEventListener("change",layout):window.addEventListener("resize",layout);
})();

;

(()=>{
 const mq=window.matchMedia("(min-width:901px)");
 const panel=document.getElementById("map-panel");
 const details=document.getElementById("mapAdvancedControls");
 const stage=panel?.querySelector(".map-stage");
 const map=stage?.querySelector("#map");
 if(!panel||!details||!stage||!map)return;
 const enforce=()=>{
  if(!mq.matches)return;
  details.open=true;
  if(stage.closest("details"))panel.appendChild(stage);
  if(map.closest("details"))stage.appendChild(map);
  stage.hidden=false;map.hidden=false;
  if(window.L&&window.mewMap&&typeof window.mewMap.invalidateSize==="function")requestAnimationFrame(()=>window.mewMap.invalidateSize());
 };
 enforce();
 mq.addEventListener?mq.addEventListener("change",enforce):window.addEventListener("resize",enforce);
})();

;

(()=>{
 const form=document.getElementById("cwSponsorApplication");
 if(!form)return;
 const status=document.getElementById("cwSponsorFormStatus"),button=document.getElementById("cwSponsorSubmit");
 const show=(message,type)=>{status.textContent=message;status.className="cw-form-status is-visible "+(type==="error"?"is-error":"is-success");};
 form.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const data=new FormData(form);
  if(String(data.get("company_fax")||"").trim())return;
  const file=data.get("logo");
  if(file&&file.size>2*1024*1024){show("Please choose a logo smaller than 2 MB.","error");return;}
  const allowed=["image/png","image/jpeg","image/webp"];
  if(file&&file.size&&!allowed.includes(file.type)){show("Please upload a PNG, JPG or WebP image.","error");return;}
  button.disabled=true;button.textContent="Submitting application…";status.className="cw-form-status";
  let logoPath=null;
  try{
   if(file&&file.size){
    const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";
    logoPath="applications/"+crypto.randomUUID()+"."+ext;
    const upload=await db.storage.from("sponsor-logos").upload(logoPath,file,{contentType:file.type,upsert:false});
    if(upload.error)throw upload.error;
   }
   const row={
    business_name:String(data.get("business_name")).trim(),
    contact_name:String(data.get("contact_name")).trim(),
    email:String(data.get("email")).trim(),
    phone:String(data.get("phone")||"").trim()||null,
    website:String(data.get("website")||"").trim()||null,
    city:String(data.get("city")||"").trim()||null,
    service_area:String(data.get("service_area")||"").trim()||null,
    logo_path:logoPath,
    description:String(data.get("description")).trim(),
    services:String(data.get("services")).trim(),
    social_links:String(data.get("social_links")||"").trim()||null,
    sponsorship_tier:String(data.get("sponsorship_tier")),
    preferred_display_name:String(data.get("preferred_display_name")||"").trim()||null,
    custom_partnership:data.get("custom_partnership")==="true"
   };
   const result=await db.from("sponsor_applications").insert(row);
   if(result.error)throw result.error;
   form.reset();
   show("Thank you! Your sponsor application has been received. CoastWatch FL will review it and contact you about next steps. Please do not send payment until your application is approved.","success");
  }catch(error){
   console.error("CoastWatch sponsor application error:",error);
   show("We couldn't submit your application right now. Please try again later or contact CoastWatch FL.","error");
  }finally{button.disabled=false;button.textContent="Submit sponsor application";}
 });
})();

;

(async function loadCoastWatchEditorialFeed(){
 const section=document.getElementById("cw-editorial-feed"),host=document.getElementById("cw-editorial-list");
 if(!section||!host)return;
 const safe=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 try{
  const {data,error}=await db.from("editorial_updates").select("id,title,summary,body,category,source_name,source_url,published_at,expires_at").eq("status","published").or("expires_at.is.null,expires_at.gt."+new Date().toISOString()).order("published_at",{ascending:false}).limit(8);
  if(error)throw error;
  if(!data||!data.length){section.hidden=true;return;}
  host.innerHTML=data.map(item=>'<article class="cw-editorial-card"><div class="cw-editorial-category">'+safe(item.category)+'</div><h3>'+safe(item.title)+'</h3><p>'+safe(item.summary)+'</p><details><summary>Read full update</summary><p>'+safe(item.body).replace(/\r?\n/g,"<br>")+'</p></details><a href="'+safe(item.source_url)+'" target="_blank" rel="noopener noreferrer">Source: '+safe(item.source_name)+' ↗</a><time datetime="'+safe(item.published_at)+'">Published '+new Date(item.published_at).toLocaleString()+'</time>'+(item.expires_at?'<time class="cw-editorial-expiry" datetime="'+safe(item.expires_at)+'">Expires '+new Date(item.expires_at).toLocaleString()+'</time>':'')+'</article>').join("");
  section.hidden=false;
 }catch(error){console.warn("CoastWatch editorial feed unavailable:",error);section.hidden=true;}
})();

;

(()=>{const invites=document.querySelectorAll("#cwi-invite");if(!invites.length)return;const spanish=/^es(?:-|$)/i.test(navigator.language||"en");invites.forEach(invite=>{invite.textContent=spanish?"¡Puedes chatear conmigo, te ayudaré!":"You can chat with me, I will help you!";window.setTimeout(()=>{invite.classList.remove("cwi-invite-hidden");window.setTimeout(()=>invite.classList.add("cwi-invite-hidden"),40000)},4000)})})();

;

(()=> {
 const $=id=>document.getElementById(id),launch=$("cwi-launch"),panel=$("cwi-panel");
 if(!launch||!window.supabase)return;
 const client=window.supabase.createClient("https://lqzxzlaxvfjuklyzxbex.supabase.co","sb_publishable_Lg56W-Uj-4-_CcQHBLguDg_trvtoqIO",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 let session=null,conversationId=null,busy=false,starting=false,profanityWarningIssued=false,chatLocked=false;
 const profanityTerms=["fuck","fucking","fucked","fucker","motherfucker","shit","shitty","bullshit","bitch","bitches","bitching","asshole","assholes","arsehole","bastard","bastards","dickhead","dick","dicks","pussy","pussies","cunt","cunts","motherfucking","jackass","dumbass","dipshit","horseshit","crap","damn","puta","puto","putas","putos","mierda","mierdas","joder","jodido","jodida","coño","cojones","cabron","cabrona","cabrones","pendejo","pendeja","pendejos","pinche","chingar","chingada","chingado","chingados","verga","vergas","culero","culera","maricon","maricón"];
 const profanityPattern=new RegExp("(^|[^\\p{L}\\p{N}_])(?:"+profanityTerms.join("|")+")(?![\\p{L}\\p{N}_])","iu");
 const containsProfanity=text=>profanityPattern.test(String(text||""));
 function lockChat(){
   chatLocked=true;
   const input=$("cwi-input"),sendButton=$("cwi-send"),newChat=$("cwi-new");
   input.disabled=true;input.placeholder="Chat ended due to repeated profanity.";
   sendButton.disabled=true;sendButton.textContent="Chat closed";
   newChat.disabled=true;
   input.setAttribute("aria-label","Chat closed");
 }

 const mode=on=>{$("cwi-chat").hidden=!on;$("cwi-chat").style.display=on?"flex":"none";};
 function bubble(role,content,sources=[]){const el=document.createElement("div");el.className="cwi-msg "+(role==="user"?"user":"bot");const linkPattern=/https?:\/\/[^\s<>"']+/g;let cursor=0,match;while((match=linkPattern.exec(String(content||"")))!==null){const raw=match[0];let url=raw;while(/[.,!?;:]$/.test(url))url=url.slice(0,-1);if(match.index>cursor)el.appendChild(document.createTextNode(String(content).slice(cursor,match.index)));const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=url;a.className="cwi-inline-link";el.appendChild(a);if(raw.length>url.length)el.appendChild(document.createTextNode(raw.slice(url.length)));cursor=match.index+raw.length;}if(cursor<String(content||"").length)el.appendChild(document.createTextNode(String(content).slice(cursor)));if(sources.length){const wrap=document.createElement("div");wrap.className="cwi-sources";sources.forEach(src=>{if(!src?.url||!(src.url.startsWith("https://")||src.url.startsWith("http://")))return;const a=document.createElement("a");a.href=src.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=src.title||src.url;wrap.appendChild(a)});el.appendChild(wrap)}$("cwi-messages").appendChild(el);$("cwi-messages").scrollTop=$("cwi-messages").scrollHeight;}
 function reset(){conversationId=null;$("cwi-messages").replaceChildren();const spanish=/^es(?:-|$)/i.test(navigator.language||"en");bubble("bot",spanish?"¡Hola! Soy CoastWatch Intelligence, tu asistente de información comunitaria. Pregúntame sobre el clima local, alertas, inundaciones, peligros en las carreteras, cortes de electricidad, refugios o las últimas noticias. No necesitas una cuenta para chatear.":"Hi! I'm CoastWatch Intelligence, your community information robot. Ask me about local weather, alerts, flooding, road hazards, power outages, shelters, or News Desk updates. You don't need an account to chat.");}
 async function startGuestSession(){
   if(starting)return;starting=true;mode(true);
   const msg=$("cwi-messages");msg.replaceChildren();bubble("bot","Connecting to CoastWatch…");
   try{
     const current=await client.auth.getSession();
     if(current.data?.session){session=current.data.session;}
     else{
       const {data,error}=await client.auth.signInAnonymously();
       if(error)throw error;
       session=data.session;
     }
     msg.replaceChildren();reset();
   }catch(err){
     msg.replaceChildren();
     bubble("bot","I couldn't start a guest chat. Please try again in a moment. "+(err?.message||""));
   }finally{starting=false;}
 }
 async function send(e){e.preventDefault();if(busy||chatLocked)return;const input=$("cwi-input"),message=input.value.trim();if(!message)return;
if(!session&&starting){const button=$("cwi-send");button.disabled=true;button.textContent="Connecting…";try{for(let attempt=0;attempt<30&&!session;attempt++)await new Promise(resolve=>setTimeout(resolve,200));}finally{button.disabled=false;button.textContent="Send";}}if(!session){bubble("bot","I’m still connecting. Please try sending your message again in a moment.");return;}if(!message)return;busy=true;$("cwi-send").disabled=true;input.value="";bubble("user",message);const pending=document.createElement("div");pending.className="cwi-msg bot";const urgent=/(\\b(?:emergency|urgent|911|help me|injured|hurt|trapped|fire|flood|flooding|water rising|evacuate|evacuation|tornado|hurricane|lightning|downed power|power line|gas leak|road closed|accident|in danger)\\b|emergencia|urgente|inundaci[oó]n|herido|atrapado|incendio|evacuar|peligro|cable ca[ií]do)/i.test(message);const loadingLines=urgent?["Checking official alerts and local reports…"]:["Rummaging through my digital filing cabinet…","Asking the weather satellites what they've been up to…","Consulting the tiny brains inside the server…","Sorting the data before it starts a group chat…","Checking official feeds. The internet raccoons are being supervised…","Scanning local updates—hold my imaginary coffee…","Cross-checking the facts so I don't embarrass myself in public…"];let loadingIndex=0;pending.textContent=loadingLines[0];$("cwi-messages").appendChild(pending);const loadingTimer=urgent?null:setInterval(()=>{loadingIndex=(loadingIndex+1)%loadingLines.length;pending.textContent=loadingLines[loadingIndex];},1900);try{const isMobileDevice=navigator.userAgentData?.mobile??(/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)||((window.matchMedia("(max-width: 768px)").matches)&&window.matchMedia("(pointer: coarse)").matches));const deviceContext=isMobileDevice?"PHONE / TABLET":"COMPUTER / PC";const contextualMessage="[DEVICE_CONTEXT: "+deviceContext+"] "+message;const {data,error}=await client.functions.invoke("coastwatch-ai",{body:{message:contextualMessage,conversationId,preferredLanguage:/^es(?:-|$)/i.test(navigator.language||"en")?"es":"en"}});if(loadingTimer)clearInterval(loadingTimer);pending.remove();if(error)throw error;if(data?.error)throw new Error(data.error);conversationId=data.conversationId||conversationId;if(data.moderation==="suspended")lockChat();bubble("bot",data.answer||"I couldn't prepare an answer.",data.sources||[]);}catch(err){if(loadingTimer)clearInterval(loadingTimer);pending.remove();let msg=err?.message||"The assistant is temporarily unavailable.";try{if(err.context?.json){const p=await err.context.json();if(p.error)msg=p.error}}catch(_){}bubble("bot",msg)}finally{busy=false;$("cwi-send").disabled=false;input.focus();}}
 launch.addEventListener("click",()=>{const open=!panel.classList.contains("open");panel.classList.toggle("open",open);launch.setAttribute("aria-expanded",String(open));if(open)startGuestSession()});
 $("cwi-close").addEventListener("click",()=>{panel.classList.remove("open");launch.setAttribute("aria-expanded","false")});
 $("cwi-new").addEventListener("click",reset);
 $("cwi-form").addEventListener("submit",send);
 $("cwi-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("cwi-form").requestSubmit()}});
 client.auth.onAuthStateChange((_event,s)=>{session=s;});
 mode(true);
})();


/* Hide time-limited static notices once their published end time has passed. */
(()=>{const now=Date.now();document.querySelectorAll("[data-expires-at]").forEach(el=>{const expiry=Date.parse(el.dataset.expiresAt||"");if(Number.isFinite(expiry)&&expiry<=now)el.hidden=true;});})();
