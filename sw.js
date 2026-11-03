const CACHE='mew-shell-v2';
const FILES=['./','./index.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;

  const url=new URL(request.url);
  const isPage=request.mode==='navigate' || url.pathname.endsWith('/index.html') || url.pathname==='/';

  if(isPage){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put(request,response.clone());
        }
        return response;
      }catch(error){
        return (await caches.match(request)) || (await caches.match('./index.html'));
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached) return cached;
    try{
      const response=await fetch(request);
      if(response.ok && url.origin===self.location.origin){
        const cache=await caches.open(CACHE);
        await cache.put(request,response.clone());
      }
      return response;
    }catch(error){
      return caches.match('./index.html');
    }
  })());
});