/* CoastWatch FL sponsor network: scheduled, tier-weighted placements across approved locations. */
(()=>{
 const hosts=[...document.querySelectorAll("[data-cw-sponsor-placement]")];
 const carousel=document.getElementById("community-partner-ads");
 if((!hosts.length&&!carousel)||!window.supabase)return;
 const db=supabase.createClient("https://lqzxzlaxvfjuklyzxbex.supabase.co","sb_publishable_Lg56W-Uj-4-_CcQHBLguDg_trvtoqIO",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const safeHttps=value=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:""}catch{return""}};
 const tierWeight=tier=>({presenting_1000_plus:4,regional_500:3,local_250:2,community_100:1}[tier]||1);
 const placements=[...new Set(["homepage_banner",...hosts.map(h=>h.dataset.cwSponsorPlacement)])];
 const track=(id,type)=>db.from("sponsor_ad_events").insert({campaign_id:id,event_type:type,page_path:location.pathname}).then(({error})=>{if(error)console.warn("Sponsor event not recorded:",error.message)});
 const seen=new Map();
 function refreshCarouselDots(){
  if(!carousel)return;
  const progress=carousel.querySelector(".cw-ad-progress");
  if(!progress)return;
  const slides=[...carousel.querySelectorAll(".cw-ad-slide")];
  progress.innerHTML=slides.map((_,i)=>'<i class="'+(slides[i].classList.contains("is-active")?'is-active':'')+'"></i>').join("");
  carousel.dispatchEvent(new CustomEvent("cw:sponsor-carousel-updated"));
 }
 function renderHomepageCampaign(campaign){
  if(!carousel)return;
  const image=safeHttps(campaign.creative_image_path),destination=safeHttps(campaign.destination_url);
  if(!image||!destination)return;
  const profile=campaign.sponsor_profiles||{},name=profile.display_name||profile.business_name||"CoastWatch FL sponsor";
  let slide=carousel.querySelector('[data-cw-campaign-slide="true"]');
  if(!slide){
   slide=document.createElement("article");
   slide.className="cw-ad-slide cw-ad-sponsor is-active";
   slide.dataset.cwCampaignSlide="true";
   slide.setAttribute("aria-hidden","false");
   carousel.querySelector(".cw-ad-slides")?.prepend(slide);
  }
  slide.innerHTML='<a class="cw-home-sponsor-link" href="'+esc(destination)+'" target="_blank" rel="sponsored noopener noreferrer" aria-label="Sponsored business: '+esc(name)+'"><img src="'+esc(image)+'" alt="'+esc(name)+' — '+esc(campaign.title||"Sponsored message")+'" fetchpriority="high" decoding="async"><span class="cw-home-sponsor-overlay"><small>SPONSORED PARTNER · '+esc(name)+'</small><strong>'+esc(campaign.title||name)+'</strong><span>Learn more ↗</span></span></a>';
  const key="homepage_banner",campaignId=campaign.id;
  if(seen.get(key)!==campaignId){track(campaignId,"impression");seen.set(key,campaignId);}
  slide.querySelector("a").addEventListener("click",()=>track(campaignId,"click"),{once:true});
  carousel.querySelectorAll(".cw-ad-slide").forEach((s,i)=>{s.classList.toggle("is-active",i===0);s.setAttribute("aria-hidden",String(i!==0));});
  const caption=carousel.querySelector(".cw-ad-caption");
  if(caption)caption.innerHTML='<span class="cw-ad-pulse"></span> Sponsored partner <span class="cw-ad-progress" aria-hidden="true"></span>';
  refreshCarouselDots();
 }
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
   if(carousel)carousel.dataset.sponsorLoading="false";
   const now=Date.now(),active=(data||[]).filter(c=>(!c.starts_at||Date.parse(c.starts_at)<=now)&&(!c.ends_at||Date.parse(c.ends_at)>now)&&c.sponsor_profiles);
   const decks={};
   placements.forEach(placement=>{
    const eligible=active.filter(c=>c.placement===placement&&safeHttps(c.creative_image_path)&&safeHttps(c.destination_url));
    const deck=[];
    eligible.forEach(c=>{for(let i=0;i<tierWeight(c.sponsor_profiles.tier);i++)deck.push(c);});
    decks[placement]=deck;
   });
   const positions={};
   const homepageDeck=decks.homepage_banner||[];
   if(homepageDeck.length)renderHomepageCampaign(homepageDeck[0]);
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
  }catch(error){if(carousel)carousel.dataset.sponsorLoading="false";console.warn("CoastWatch sponsor network unavailable:",error.message);}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();