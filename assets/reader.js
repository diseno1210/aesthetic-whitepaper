'use strict';
const $ = id => document.getElementById(id);
const index = JSON.parse($('search-data').textContent);
const tocLinks = [...document.querySelectorAll('#toc a')];
const headings = [...document.querySelectorAll('article h1, article h2, article h3, article h4, article h5')].filter(h=>h.textContent.trim());
let lastId = '';
let activeId = '';
const saved = key => {try{return localStorage.getItem(key);}catch{return null;}};
const save = (key,value) => {try{localStorage.setItem(key,value);}catch{}};
const storedFont=Number(saved('whitepaper-font'));
if(storedFont>=14 && storedFont<=24){$('font-size').value=storedFont;document.documentElement.style.setProperty('--body-size',storedFont+'px');}
$('font-size').addEventListener('change',event=>{const size=Math.min(24,Math.max(14,Number(event.target.value)||17));event.target.value=size;document.documentElement.style.setProperty('--body-size',size+'px');save('whitepaper-font',size);});
function closeDrawer(){document.body.classList.remove('drawer-open');$('drawer-shade').hidden=true;$('menu').setAttribute('aria-expanded','false');}
$('menu').addEventListener('click',()=>{
  if(matchMedia('(max-width:760px)').matches){const open=document.body.classList.toggle('drawer-open');$('drawer-shade').hidden=!open;$('menu').setAttribute('aria-expanded',String(open));}
  else{document.body.classList.toggle('sidebar-hidden');$('menu').setAttribute('aria-expanded',String(!document.body.classList.contains('sidebar-hidden')));}
});
$('drawer-shade').addEventListener('click',closeDrawer);
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDrawer();});
tocLinks.forEach(a=>a.addEventListener('click',closeDrawer));
$('toc-filter').addEventListener('input',event=>{const query=event.target.value.trim().toLocaleLowerCase();tocLinks.forEach(a=>a.hidden=!!query&&!a.textContent.toLocaleLowerCase().includes(query));});
$('print').addEventListener('click',()=>{document.querySelectorAll('article img').forEach(img=>img.loading='eager');window.print();});

function navigate(id){
  const target=$(id);if(!target)return;
  history.replaceState(null,'','#'+id);
  target.scrollIntoView({block:'start'});
  target.classList.add('flash');setTimeout(()=>target.classList.remove('flash'),1800);
  closeDrawer();
}
lastId=saved('whitepaper-position')||'';
if(lastId&&$(lastId)){$('resume').hidden=false;$('resume').addEventListener('click',()=>navigate(lastId));}
let tick=false;
function updateReading(){
  tick=false;
  const max=document.documentElement.scrollHeight-innerHeight;
  $('progress').textContent=Math.round(max>0?scrollY/max*100:0)+'%';
  let low=0,high=headings.length-1,found=0;
  while(low<=high){const middle=(low+high)>>1;if(headings[middle].getBoundingClientRect().top<=120){found=middle;low=middle+1;}else high=middle-1;}
  const heading=headings[found];
  if(heading&&activeId!==heading.id){
    activeId=heading.id;
    tocLinks.forEach(a=>a.classList.toggle('active',a.hash==='#'+activeId));
    save('whitepaper-position',activeId);
  }
}
addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(updateReading);}}, {passive:true});
addEventListener('resize',()=>{if(!matchMedia('(max-width:760px)').matches)closeDrawer();updateReading();});
updateReading();

const escapeHtml = text => text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
let matches=[],shown=0,query='';
function showResults(){
  const end=Math.min(shown+60,matches.length);
  const fragment=document.createDocumentFragment();
  for(let i=shown;i<end;i++){
    const item=matches[i],position=item.text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
    const start=Math.max(0,position-55),finish=Math.min(item.text.length,position+query.length+110);
    const snippet=item.text.slice(start,finish),relative=position-start;
    const button=document.createElement('button');button.type='button';button.className='search-result';
    button.innerHTML='<strong>'+escapeHtml(item.heading)+'</strong><span>'+(start?'…':'')+escapeHtml(snippet.slice(0,relative))+'<mark>'+escapeHtml(snippet.slice(relative,relative+query.length))+'</mark>'+escapeHtml(snippet.slice(relative+query.length))+(finish<item.text.length?'…':'')+'</span>';
    button.addEventListener('click',()=>{$('search-dialog').close();navigate(item.id);});
    fragment.append(button);
  }
  $('search-results').append(fragment);shown=end;$('search-more').hidden=shown>=matches.length;
}
function search(){query=$('query').value.trim();matches=query?index.filter(item=>item.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())):[];shown=0;$('search-results').replaceChildren();$('search-summary').textContent=query?matches.length+' 条结果':'';showResults();}
$('search-open').addEventListener('click',()=>{$('search-dialog').showModal();$('query').focus();});
$('search-close').addEventListener('click',()=>$('search-dialog').close());
let searchTimer;$('query').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(search,150);});
$('search-more').addEventListener('click',showResults);
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('search-dialog').showModal();$('query').focus();}});

function openImage(img){$('large-image').src=img.src;$('large-image').alt=img.alt;$('image-caption').textContent=img.closest('figure').querySelector('figcaption')?.textContent||'';$('image-dialog').showModal();}
document.querySelectorAll('article figure img').forEach(img=>{img.addEventListener('click',()=>openImage(img));img.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();openImage(img);}});});
$('image-close').addEventListener('click',()=>$('image-dialog').close());
for(const dialog of [$('image-dialog'),$('search-dialog')])dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});

