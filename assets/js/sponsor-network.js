/* CoastWatch FL sponsor network: scheduled, tier-weighted placements across approved locations. */
(()=>{
 const hosts=[...document.querySelectorAll("[data-cw-sponsor-placement]")];
 if(!hosts.length||!window.supabase)return;
 const db=supabase.createClient("https://lqzxzlaxvfjuklyzxbex.supabase.co","sb_publishable_Lg56W-Uj-4-_CcQHBLguDg_trvtoqIO",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const safeHttps=value=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:""}catch{return""}};
 const tierWeight=tier=>({presenting_1000_plus:4,regional_500:3,local_250:2,community_100:1}[tier]||1);
 const placements=[...new Set(hosts.map(h=>h.dataset.cwSponsorPlacement))];
 const track=(id,type)=>db.from("sponsor_ad_events").insert({campaign_id:id,event_type:type,page_path:location.pathname}).then(({error})=>{if(error)console.warn("Sponsor event not recorded:",error.message)});
 const seen=new Map();
 function render(host,campaign){
  const image=safeHttps(campaign.creative_image_path),destination=safeHttps(campaign.destination_url);
  if(!image||!destination){host.hidden=true;return;}
  const profile=campaign.sponsor_profiles||{},name=profile.display_name||profile.business_name||"CoastWatch FL sponsor";
  host.innerHTML='<a href="'+esc(destination)+'" target="_blank" rel="sponsored noopener noreferrer" aria-label="Sponsored business: '+esc(name)+'"><img src="'+esc(image)+'" alt="'+esc(name)+' sponsored message" loading="lazy" decoding="async"><span class="cw-live-sponsor-copy"><small>Sponsored · '+esc(name)+'</small><strong>'+esc(campaign.title||name)+'</strong><span>Learn more about this local business ↗</span></span></a>';
  host.hidden=false;
  const key=host.dataset.cwSponsorPlacement;
  const campaignKey=key+":"+campaign.id;
  if(seen.get(key)!==campaign.id){track(campaign.id,"impression");seen.set(key,campaign.id);}
  host.querySelector("a").addEventListener("click",()=>track(campaign.id,"click"),{once:true});
 }
 async function init(){
  try{
   const {data,error}=await db.from("sponsor_campaigns")
    .select("id,title,creative_image_path,destination_url,placement,starts_at,ends_at,sponsor_profiles(business_name,display_name,tier)")
    .eq("status","active").in("placement",placements)
    .or("starts_at.is.null,starts_at.lte."+new Date().toISOString())
    .order("created_at",{ascending:false}).limit(100);
   if(error)throw error;
   const now=Date.now(),active=(data||[]).filter(c=>(!c.starts_at||Date.parse(c.starts_at)<=now)&&(!c.ends_at||Date.parse(c.ends_at)>now)&&c.sponsor_profiles);
   const decks={};
   placements.forEach(placement=>{
    const eligible=active.filter(c=>c.placement===placement&&safeHttps(c.creative_image_path)&&safeHttps(c.destination_url));
    const deck=[];
    eligible.forEach(c=>{for(let i=0;i<tierWeight(c.sponsor_profiles.tier);i++)deck.push(c);});
    decks[placement]=deck;
   });
   const positions={};
   hosts.forEach(host=>{
    const placement=host.dataset.cwSponsorPlacement,deck=decks[placement]||[];
    if(!deck.length){host.hidden=true;return;}
    positions[placement]=positions[placement]||0;
    render(host,deck[0]);
   });
   if(placements.some(p=>(decks[p]||[]).length>1)){
    window.setInterval(()=>{
     if(document.hidden)return;
     hosts.forEach(host=>{
      const placement=host.dataset.cwSponsorPlacement,deck=decks[placement]||[];
      if(deck.length<2)return;
      positions[placement]=(positions[placement]+1)%deck.length;
      render(host,deck[positions[placement]]);
     });
    },12000);
   }
  }catch(error){console.warn("CoastWatch sponsor network unavailable:",error.message);}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();