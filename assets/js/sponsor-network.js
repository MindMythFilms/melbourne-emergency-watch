/* CoastWatch FL approved sponsor campaign placement + basic first-party event counts. */
(()=>{
 const host=document.getElementById("cw-live-sponsor-placement");if(!host)return;
 const db=supabase.createClient("https://lqzxzlaxvfjuklyzxbex.supabase.co","sb_publishable_Lg56W-Uj-4-_CcQHBLguDg_trvtoqIO",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const track=(id,type)=>db.from("sponsor_ad_events").insert({campaign_id:id,event_type:type,page_path:location.pathname}).then(({error})=>{if(error)console.warn("Sponsor event not recorded:",error.message)});
 async function load(){
  try{
   const {data,error}=await db.from("sponsor_campaigns").select("id,title,creative_image_path,destination_url,placement,sponsor_profiles(business_name,display_name)").eq("status","active").eq("placement","homepage_banner").or("starts_at.is.null,starts_at.lte."+new Date().toISOString()).order("created_at",{ascending:false}).limit(1);
   if(error)throw error;
   const campaign=(data||[]).find(x=>(!x.starts_at||new Date(x.starts_at)<=new Date())&&(!x.ends_at||new Date(x.ends_at)>new Date()));
   if(!campaign||!campaign.creative_image_path||!campaign.creative_image_path.startsWith("https://")||!campaign.destination_url||!campaign.destination_url.startsWith("https://"))return;
   const sponsor=campaign.sponsor_profiles||{},name=sponsor.display_name||sponsor.business_name||"CoastWatch FL sponsor";
   host.innerHTML='<a href="'+esc(campaign.destination_url)+'" target="_blank" rel="sponsored noopener noreferrer" aria-label="Sponsored: '+esc(name)+'"><img src="'+esc(campaign.creative_image_path)+'" alt="'+esc(name)+' advertisement" loading="lazy"><span class="cw-live-sponsor-copy"><small>Sponsored business</small><strong>'+esc(campaign.title||name)+'</strong><span>'+esc(name)+' · Learn more ↗</span></span></a>';
   host.hidden=false;track(campaign.id,"impression");
   host.querySelector("a").addEventListener("click",()=>track(campaign.id,"click"),{once:true});
  }catch(error){console.warn("Sponsor placement unavailable:",error.message);}
 }
 if(window.supabase)load();else document.addEventListener("DOMContentLoaded",load,{once:true});
})();