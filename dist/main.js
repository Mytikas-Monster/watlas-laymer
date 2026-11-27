(function(){
'use strict';
const $=s=>document.querySelector(s);
const paths={
  overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  map:'<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2zM9 3v15m6-12v15"/>',
  dungeon:'<path d="M3 20v-9l2-3V4h3v3h3V3h3v4h3V4h3v4l1 3v9H3zM9 20v-5a3 3 0 0 1 6 0v5"/>',
  journal:'<path d="M5 4h14v16H5zM8 4v16m3-11h5m-5 4h4"/>',
  book:'<path d="M3 5c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2zM12 7v14"/>',
  shield:'<path d="m12 3 8 3v6c0 4-3 7-8 10-5-3-8-6-8-10V6zM12 7v10"/>',
  flag:'<path d="M5 21V4c4-4 9 3 14-1v10c-5 4-10-3-14 1"/>',
  swords:'<path d="m4 3 4 1 12 14-2 2L5 7zM15 19l5-5M19 3l1 4-5 6m-4 3-5 5-2-2 5-5M4 14l5 5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  sunrise:'<path d="M3 17h18m-17 4h16M7 16a5 5 0 0 1 10 0M12 3v5M4 8l3 3m13-3-3 3M1 13l3 1m19-1-3 1"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16.5 7.5-3 6-6 3 3-6z"/>',
  star:'<path d="m12 1 2.3 8.7L22 12l-7.7 2.3L12 23l-2.3-8.7L2 12l7.7-2.3z"/><path d="m5 5 4 3m7 8 3 3m0-14-3 3m-8 8-3 3"/>',
  mountain:'<path d="m2 20 9-16 11 16H2zm5-9 4 3 3-4"/>',
  xp:'<path d="m3 19 6-8 4 4 8-11m-6 0h6v6"/>',gauge:'<path d="M3 18a10 10 0 1 1 18 0H3zm9-5 5-4M6 15l2-1m4-9v3m-7 2 2 1"/><circle cx="12" cy="14" r="1"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  play:'<path d="m6 3 14 9-14 9z" fill="currentColor" stroke="none"/>',
  edit:'<path d="M13 5H5v15h14v-8M9 15l1-4L18 3l3 3-8 8z"/>',
  pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  layers:'<path d="m2 8 10-5 10 5-10 5zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  'arrow-right':'<path d="M3 12h17m-6-6 6 6-6 6"/>','arrow-up-right':'<path d="M6 18 18 6M7 6h11v11"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
  backpack:'<path d="M5 19V9a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Zm4-14a3 3 0 0 1 6 0M8 12h8v6H8z"/>',
  coin:'<ellipse cx="12" cy="8" rx="8" ry="4"/><path d="M4 8v6c0 5 16 5 16 0V8m-16 4c0 5 16 5 16 0"/>',
  route:'<circle cx="5" cy="17" r="2"/><circle cx="18" cy="6" r="2"/><path d="M7 17h8a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6"/>',
  'chevron-right':'<path d="m9 5 7 7-7 7"/>',timer:'<circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 0v4m6 2 2-2m-8 4v5"/>',
  sword:'<path d="m4 20 4-4m-4-3 7 7m-4-6L18 3h3v3L10 17"/>',scroll:'<path d="M18 4H7a3 3 0 0 0-3 3v2h4m0-5v14a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-2h-5V7a3 3 0 0 1 3-3"/>'
};
function icon(name,size=16){return `<svg class="ico" aria-hidden="true" viewBox="0 0 24 24" width="${Number(size)||16}" height="${Number(size)||16}" fill="none" stroke="currentColor" stroke-width="1.6">${paths[name]||paths.compass}</svg>`;}
function icons(){document.querySelectorAll('i[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon,el.dataset.size||14));}
const nav=[['checkpoint','Checkpoint','flag'],['daily-prompt','Daily Prompt','scroll'],['overview','Overview','overview'],['routes','Route planner','map'],['dungeons','Dungeons','dungeon'],['journal','Session log','journal'],['research','Research','book'],['grinding','Grinding tips','swords']];
const key='warrior-atlas:laymer:dashboard:v1';
function read(){try{return JSON.parse(localStorage.getItem(key))||{};}catch{return {};}}
function save(update){try{localStorage.setItem(key,JSON.stringify({...read(),...update}));return true;}catch{notice('Browser storage is unavailable.');return false;}}
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function selectedRoute(){
 const s=Tracker.summary(),items=Routes.items,prefs=read(),chosen=items.find(x=>x.id===prefs.route);
 if (chosen&&(prefs.pickedAtLevel===s.level||(s.level>=chosen.min&&s.level<=chosen.max)))return chosen;
 const preferred=Tracker.preferredRoute(items);
 if(preferred)return items.find(item=>item.id===preferred.id);
 return items.find(x=>x.type==='Questing'&&x.min<=s.level&&s.level<=x.max)||items[0];
}
function selectRoute(id){const r=Routes.items.find(i=>i.id===id);if(!r)return;if(save({route:id,pickedAtLevel:Tracker.summary().level})){notice('Active route set to '+r.title);if(page()==='overview')dashboard();}}
let nt;
function notice(text){const n=$('#notice');n.textContent=text;n.classList.add('show');clearTimeout(nt);nt=setTimeout(()=>n.classList.remove('show'),3200);}
function modal(title,html){const d=$('#dialog');$('#modal-title').textContent=title;$('#modal-content').innerHTML=html;if(!d.open)d.showModal();d.scrollTop=0;}
function closeModal(){const d=$('#dialog');if(d.open)d.close();}
window.Atlas={icon,modal,closeModal,selectRoute,selectedRoute,getLevel:()=>Tracker.summary().level,notice};
function page(){const p=location.hash.slice(1).split('/')[0];return nav.some(n=>n[0]===p)?p:'checkpoint';}
function button(label,act,glyph,primary=false){return `<button class="act ${primary?'primary':''}" data-action="${act}">${icon(glyph,15)}${label}</button>`;}
function link(label,href){return `<a class="link-button" href="${href}">${label}${icon('arrow-right',14)}</a>`;}
function stat(glyph,heading,value,note){return `<div class="stat"><div class="stat-label">${icon(glyph,16)}${heading}</div><p class="stat-value">${value}</p><div class="stat-note">${note}</div></div>`;}
function tile(r){
 const titles={'tanaris':'Tanaris quest circuit','feralas':'Feralas field loop'};
 const desc={'zul-farrak':'Stack Gadgetzan quests for a first clear with a ready party.','tanaris':'Clear overlapping pirate bounties along the coast.','feralas':'Hunt yetis near Feathermoon when Tanaris is contested.'};
 const art=r.art==="chart"?'<span class="tile-img tile-survey">'+icon("dungeon",32)+'</span>':'<img alt="" class="tile-img" src="'+r.image+'">';
 return `<button type="button" class="route-tile" data-home-route="${r.id}">${art}<div class="tile-body"><span class="route-flag ${r.type.toLowerCase()}">${icon(({Dungeon:'dungeon',Questing:'scroll',Grinding:'swords'})[r.type],12)}${r.type}</span><h3>${titles[r.id]||r.title}</h3><p class="tile-text">${desc[r.id]||r.description}</p><div class="tile-foot"><span>${icon('layers',12)} Lv. ${r.min}–${r.max}</span>${icon('arrow-right',15)}</div></div></button>`;
}
function header(title,glyph,action=''){return `<div class="section-head"><div class="section-title">${icon(glyph,21)}<h2>${title}</h2></div>${action}</div>`;}
function today(date=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
function checklist(s){
 const r=selectedRoute();
 if(s.level===60)return [['Review the last session','Compare elapsed XP/hour with your earlier runs.'],['Record your final kit','Save your wallet and equipped weapon.'],['Export your session history','Download your results from the session log.']];
 if(r.id==='tanaris')return [['Stage in Gadgetzan','Pick up Troll Temper and Divino-matic Rod.'],['Quest while recruiting','Work the Tanaris coast until a healer is ready.'],['Compare your pace','Count travel and PvP downtime in your XP/hour.']];
 return [[`Stage at ${r.staging}`,r.group==='Solo'?'Open the route and check unfinished objectives.':'Confirm the healer, quest pickups and expected clear.'],['Start the session clock','Include group formation, travel and recovery.'],['Keep a fallback ready',r.type==='Dungeon'?'Switch to an outdoor route if the party stalls.':'Move if PvP losses outweigh the ride to another camp.']];
}
function dashboard(){
 const s=Tracker.summary(),level=s.level,routes=Routes.items,available=routes.filter(r=>r.min<=level&&r.max>=level),r=selectedRoute();
 const measured=Tracker.preferredRoute(routes);
 const chosen=[available.find(r=>r.type==='Dungeon'),available.find(r=>r.type==='Questing'),available.find(r=>r.type==='Grinding')].filter(Boolean);
 for(const a of available)if(chosen.length<3&&!chosen.includes(a))chosen.push(a);
 if(measured){const leader=routes.find(x=>x.id===measured.id);const previous=chosen.findIndex(x=>x.type===leader.type);if(previous!==-1)chosen.splice(previous,1);chosen.unshift(leader);chosen.splice(3);}
 const marks=read().checks||{}, stamp=`${today()}:${level}:${r.id}`,checks=marks[stamp]||[],tasks=checklist(s);
 let rem=s.remaining>=1000000?(s.remainingIsUpperBound?Math.ceil(s.remaining/10000)/100:s.remaining/1000000).toFixed(2)+'M':s.remaining.toLocaleString('en-GB');
 const pace=s.pace===null?'—':Math.round(s.pace).toLocaleString('en-GB');
 const active=s.active;
 const compareNote=measured?'<p class="measured-note"><strong>'+routes.find(x=>x.id===measured.id).title+'</strong> leads your comparable morning routes at '+Math.round(measured.pace).toLocaleString('en-GB')+' XP/h across '+measured.count+' sessions.</p>':'';
 $('#view').innerHTML=`<section class="hero"><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i><div class="hero-content"><p class="eyebrow">${icon('star',17)}Character dossier</p><h1>Laymer Migii</h1><div class="hero-meta"><span>${icon('shield',16)}Protection Warrior</span><b></b><span>${icon('flag',15)}Human · Alliance</span><b></b><span>${icon('swords',15)}US PvP</span></div><div class="hero-actions">${button(active?'View active session':'Start session',active?'active':'start',active?'timer':'play',true)}${button('Edit progress','edit','edit')}</div></div></section>
 <section class="stats" aria-label="Campaign statistics">${stat('shield','Current level',level+' <small>/ 60</small>',level===60?'Campaign complete':(60-level)+' levels remaining')}${stat('flag','XP to level 60',(s.remainingIsUpperBound?'≤ ':'')+rem,s.remainingIsUpperBound?'Upper bound · enter current XP':'Based on your recorded progress')}${stat('xp','Session pace',pace+' <small>XP/h</small>',s.pace===null?'Awaiting first session':s.sessions+' logged session'+(s.sessions===1?'':'s')+' · all elapsed time')}${stat('sunrise','Morning window','05:00 <small>–</small> 06:00','Europe/Brussels local time')}</section>
 <div class="dashboard-grid"><section class="route-block">${header(level===60?'Completed campaign':'Recommended routes','compass',link('All routes','#routes'))}${level===60?'<div class="journey-card">Level 60 reached. Review the session log to see which routes earned the most XP per hour.</div>':`<div class="home-routes">${chosen.map(tile).join('')}</div>${compareNote}`}</section>
 <aside class="brief"><div class="brief-head"><h2>${icon('sunrise',22)} Morning briefing</h2><span class="brief-count">${checks.filter(Boolean).length} / 3</span></div><div class="brief-list">${tasks.map(([t,d],i)=>`<label class="brief-item"><input type="checkbox" data-check="${i}" ${checks[i]?'checked':''}><span><strong>${t}</strong><small>${d}</small></span></label>`).join('')}</div><button class="link-button" data-action="time">US play window ${icon('arrow-right',14)}</button></aside></div>
 <section class="journey">${header('The road to 60','route',`<button class="link-button" data-home-route="${r.id}">Active route · ${r.title} ${icon('arrow-right',14)}</button>`)}<div class="journey-card">${[[46,'Tanaris','tanaris'],[48,'Alcaz','alcaz'],[50,'Un’Goro','ungoro'],[53,'Chillwind','chillwind'],[55,'Blackmaw','blackmaw'],[58,'Shaper’s','shapers-terrace'],[60,'Level cap','']].map(([n,label,id],i)=>`${i?'<div class="track"></div>':''}<button class="milestone ${level>=n?'on':''} ${n===60?'end':''}" ${id?`data-home-route="${id}"`:'data-action="goal"'} aria-label="Level ${n}, ${label}"><b>${n}</b><span>${label}</span></button>`).join('')}</div></section>
 <section class="tool-section">${header('Field tools','backpack')}<div class="tool-grid">${[['decisions','compass','Route comparison','Weigh dungeon waits, travel and world PvP against your solo pace.'],['weapon','sword','Weapon & gold','Check whether an upgrade saves enough time on the way to 60.'],['addon','download','Companion addon','Track XP in game and bring a completed session into your log.']].map(([a,ic,t,d])=>`<button class="quick-card" data-action="${a}">${icon(ic,21)}<div><h2>${t}</h2><p>${d}</p></div></button>`).join('')}</div></section>`;
 $('#view').querySelectorAll('[data-check]').forEach(box=>box.addEventListener('change',()=>{const vals=Array.from($('#view').querySelectorAll('[data-check]'),x=>x.checked);if(save({checks:{[stamp]:vals}}))$('.brief-count').textContent=vals.filter(Boolean).length+' / 3';}));
}
function character(){
 const s=Tracker.summary(),r=selectedRoute();
 modal('Character sheet',`<div class="sheet"><p class="eyebrow">Human · Alliance · US PvP</p><h3>Laymer Migii</h3><dl>${[['Specialization','Protection Warrior'],['Current level',s.level],['Current XP',s.xp===null?'Awaiting entry':s.xp.toLocaleString('en-GB')],['Gold',s.gold==null?'Awaiting entry':s.gold.toLocaleString('en-GB',{maximumFractionDigits:4})+' g'],['Main-hand weapon',s.weapon||'Awaiting entry'],['Active route',r.title],['Target','Level 60'],['Typical session','05:00–06:00 Brussels']].map(([a,b])=>`<dt>${a}</dt><dd>${safe(b)}</dd>`).join('')}</dl>${button('Edit progress & gear','edit','edit',true)}${button('Companion addon','addon','download')}${read().route?button('Use recommended route','auto-route','compass'):''}</div>`);
}
function addon(){modal('Warrior Atlas companion',`<div class="sheet"><p>Keep a compact XP meter in game, record changes to your wallet and main hand, and see a route suggestion for your level. Mark PvP downtime when it starts and ends.</p><a class="act primary" href="assets/WarriorAtlas.zip" download>${icon('download',16)}Download addon (.zip)</a><h3>Install and record</h3><ol><li>Extract the <code>WarriorAtlas</code> folder into <code>World of Warcraft/_forever_/Interface/AddOns/</code>. Enable it on the character screen and enter the game.</li><li>Type <code>/watlas start questing</code>, <code>/watlas start dungeon</code> or <code>/watlas start grinding</code> as you begin. Start before traveling to capture the whole outing.</li><li>Use <code>/watlas pvp</code> to start or stop counting a PvP interruption. Type <code>/watlas stop</code> when you finish.</li><li>Use <code>/watlas export</code>, copy the session, then choose <strong>Import addon</strong> in the session log.</li></ol><p>Your journal stays in this browser. Paste a finished export to transfer an in-game session, and use the session log’s CSV export to keep a copy of your measurements. The addon includes a command reference and an in-game test checklist.</p><button class="act" data-action="import">${icon('journal',15)} Import addon session</button></div>`);}
function goal(){const s=Tracker.summary();modal('Level 60 goal',`<div class="sheet"><p>${s.level===60?'Laymer Migii has reached level 60.':`You have ${60-s.level} levels to go. ${s.remainingIsUpperBound?'At the beginning of this level, the remaining requirement is':'Your recorded remaining requirement is'} <strong>${s.remaining.toLocaleString('en-GB')} XP</strong>.`}</p><p>${s.etaHours!=null?`At your measured pace, this is ${s.remainingIsUpperBound?'up to ':''}${s.etaHours.toFixed(1)} played hours. The estimate changes as later routes and gear change.`:'Log a completed session to estimate the remaining hours at your own pace.'}</p>${button('Edit progress','edit','edit')}</div>`);}
function action(name){
 const acts={'auto-route':()=>{if(save({route:null,pickedAtLevel:null})){closeModal();render();notice('Using the recommended route.');}},start:Tracker.start,active:Tracker.activeDialog,edit:Tracker.edit,import:Tracker.importAddon,addon,goal,decisions:()=>Decisions.open('dungeon'),weapon:()=>Decisions.open('weapon'),time:()=>Decisions.open('time')};
 if(acts[name])acts[name]();
}
function render(scroll=false){
 if(location.hash==='#main')return;
 const p=page(),title=nav.find(n=>n[0]===p)[1];
 document.title=title+' · Warrior Atlas';$('#crumb').textContent=title;
 $('#nav').innerHTML=nav.map(([slug,t,g])=>`<a href="#${slug}" ${p===slug?'aria-current="page"':''}>${icon(g,15)}${t}</a>`).join('');
 if(p==='checkpoint')Checkpoint.render($('#view'),read,save);
 else if(p==='daily-prompt')DailyPrompt.render($('#view'),today,refreshDate);
 else if(p==='overview')dashboard();
 else if(p==='routes')Routes.render($('#view'));
 else if(p==='grinding')Grinding.render($('#view'));
 else if(p==='journal')Tracker.render($('#view'));
 else if(p==='research')Library.render($('#view'));
 else if(p==='dungeons')Dungeons.render($('#view'),location.hash.slice(1).split('/')[1]);
 if(scroll){window.scrollTo(0,0);$('#main').focus({preventScroll:true});}
}
$('#account').addEventListener('click',character);$('#close-modal').addEventListener('click',closeModal);
$('#dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeModal();}});
document.addEventListener('click',e=>{const a=e.target.closest('[data-action]'),r=e.target.closest('[data-home-route]');if(a)action(a.dataset.action);else if(r)Routes.detail(r.dataset.homeRoute);});
window.addEventListener('hashchange',()=>{closeModal();render(true);});
window.addEventListener('atlas-update',()=>render());window.addEventListener('storage',()=>{if(!$('#dialog').open)render();});
function refreshDate(){
 const d=new Date(), dateline=$('#dateline'), day=today(d);
 if(dateline.dateTime!==day){
  dateline.dateTime=day;
  dateline.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Brussels',weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(d);
 }
 return day;
}
window.addEventListener('focus',refreshDate);
refreshDate();icons();render();
})();
