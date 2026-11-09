(() => {
  const config = document.getElementById('search-config');
  if (!config) return;
  const input = document.getElementById('site-query'), form = document.querySelector('.search-form'), status = document.getElementById('search-status'), results = document.getElementById('search-results'), ui = config.dataset;
  const normalise = value => String(value).replace(/[ıİ]/g,'i').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let catalogue, timer, request = 0;
  const getCatalogue = () => catalogue ||= fetch(ui.index).then(r => { if (!r.ok) throw Error('index'); return r.json(); }).catch(error=>{catalogue=null;throw error;});
  const make = (tag, className, text) => {const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el;};
  function card(item) {
    const article=make('article','feed-card'), content=make('div','feed-content'), title=make('h2'), link=make('a','',item.title);
    const destination=new URL(item.url,location.origin);
    if (!['http:','https:'].includes(destination.protocol)) return article;
    link.href=destination.href;if(item.video){link.target='_blank';link.rel='noopener noreferrer';}
    title.append(link);content.append(title,make('p','',item.description),make('span','feed-action',item.video?ui.watch:ui.read));article.append(content);
    if(item.image){const imageURL=new URL(item.image,location.origin);if(['http:','https:'].includes(imageURL.protocol)){const media=make('div','feed-media'),image=make('img');image.src=imageURL.href;image.alt=item.alt||item.title;image.loading='lazy';image.width=400;image.height=267;media.append(image);article.append(media);}}
    return article;
  }
  async function search(updateURL=true) {
    const id=++request,q=input.value.trim().slice(0,160);results.replaceChildren();
    if(updateURL){const url=new URL(location.href);if(q)url.searchParams.set('q',q);else url.searchParams.delete('q');history.replaceState(null,'',url);}
    if(!q){status.textContent=ui.empty;return;}
    status.textContent=ui.loading;
    try {
      const items=await getCatalogue();if(id!==request)return;
      const terms=normalise(q).split(/\s+/).filter(Boolean);
      const ranked=items.map(item=>{const title=normalise(item.title),body=normalise([item.description,item.category,item.categoryName,...item.tags].join(' '));return {item,score:terms.every(term=>title.includes(term)||body.includes(term))?terms.reduce((sum,term)=>sum+(title.includes(term)?3:1),0):0};}).filter(hit=>hit.score).sort((a,b)=>b.score-a.score);
      status.textContent=ranked.length?`${ranked.length} ${ui.results}`:ui.none;results.replaceChildren(...ranked.map(hit=>card(hit.item)));
    } catch {if(id===request)status.textContent=ui.error;}
  }
  form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(timer);search();});input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,200);});
  window.addEventListener('popstate',()=>{input.value=new URL(location.href).searchParams.get('q')||'';search(false);});
  input.value=(new URL(location.href).searchParams.get('q')||'').slice(0,160);search(false);
})();
