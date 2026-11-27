(() => {
  'use strict';

  const KEY = 'warrior-atlas:laymer-migii:journal:v1';
  const cost = [123200, 129100, 135100, 141200, 147500, 153900, 160400, 167100, 173900, 180800, 187900, 195000, 202300, 209800];
  const cumulative = [0];
  for (const points of cost) cumulative.push(cumulative[cumulative.length - 1] + points);
  const modes = ['Questing', 'Dungeon', 'Grinding', 'Mixed'];
  const num = new Intl.NumberFormat('en-GB');
  const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', day: 'numeric', month: 'short', year: 'numeric' });
  const fresh = () => ({ profile: {level: 46, xp: null, approx: false}, active: null, runs: [] });
  const e = string => String(string ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[c]);
  const cap = level => cost[level - 46] || 0;
  const total = p => cumulative[p.level - 46] + (p.xp || 0);
  const valid = p => p && Number.isInteger(p.level) && p.level >= 46 && p.level <= 60 &&
    (p.xp === null || (Number.isInteger(p.xp) && p.xp >= 0 && (p.level === 60 ? p.xp === 0 : p.xp < cap(p.level))));
  const fmtTime = ms => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 1) return '<1 min';
    return minutes >= 60 ? Math.floor(minutes / 60) + 'h ' + (minutes % 60 ? minutes % 60 + 'm' : '') : minutes + ' min';
  };
  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && valid(raw.profile) && Array.isArray(raw.runs)) return raw;
    } catch (_) {}
    return fresh();
  }
  function summary() {
    const { profile, runs, active } = read();
    const time = runs.reduce((sum, r) => sum + r.ms, 0);
    const points = runs.reduce((sum, r) => sum + r.gain, 0);
    const pace = time ? points * 3600000 / time : null;
    const remaining = cumulative[14] - total(profile);
    return {level: profile.level, xp: profile.xp, xpApprox: !!profile.approx, xpToNext: cap(profile.level), remaining,
      remainingIsUpperBound: profile.xp === null, gold:profile.copper == null ? null : profile.copper/10000,
      copper:profile.copper ?? null, weapon:profile.weapon || null, pvpMinutes:sumKnown(runs,'pvpMinutes'), pvpDeaths:sumKnown(runs,'pvpDeaths'),
      deaths:sumKnown(runs,'deaths'), netGold:sumKnown(runs,'netCopper')==null ? null : sumKnown(runs,'netCopper')/10000, pace, etaHours: pace > 0 ? remaining / pace : null, sessions: runs.length, active: !!active};
  }
  async function change(fn) {
    const commit = () => {
      const state = read();
      fn(state);
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (_) { throw new Error('Browser storage is unavailable. Allow site storage and try saving again.'); }
    };
    if (navigator.locks && navigator.locks.request) await navigator.locks.request(KEY, commit);
    else commit();
    window.dispatchEvent(new CustomEvent('atlas-update'));
    if (logHost?.isConnected && logHost.querySelector('.tk-journal')) render(logHost);
  }
  window.addEventListener('storage', event => {
    if (event.key !== KEY) return;
    window.dispatchEvent(new CustomEvent('atlas-update'));
    if (logHost?.isConnected && logHost.querySelector('.tk-journal')) render(logHost);
  });
  const route = () => window.Atlas.selectedRoute?.() || {};
  const modal = (title, content) => window.Atlas.modal(title, content);
  const close = () => window.Atlas.closeModal();
  const selected = (a, b) => a === b ? ' selected' : '';
  const id = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
  const gainRate = r => r.gain * 3600000 / r.ms;
  const precise = r => (r.approx ? '≈ ' : '') + num.format(Math.round(gainRate(r)));
  const tip = (text) => '<p class="tk-hint">' + text + '</p>';
  function snapshotFields(key, label, point, allowUnknown = false) {
    const level = point?.level || 46;
    const max = cap(level);
    const pct = !!point?.approx;
    const value = level === 60 ? 0 : point?.xp == null ? '' : pct ? Number((100 * point.xp / max).toFixed(2)) : point.xp;
    const options = Array.from({length:15}, (_, i) => '<option'+selected(level, i + 46)+'>'+(i+46)+'</option>').join('');
    return '<fieldset class="tk-snapshot" data-snapshot="'+key+'" data-optional="'+!!allowUnknown+'"><legend>'+e(label)+'</legend><div class="tk-snaprow"><label>Level<select name="'+key+'Level">'+options+'</select></label><label>Progress unit<select name="'+key+'Unit"><option value="xp">Exact XP</option><option value="pct"'+selected(pct,true)+'>Percent</option></select></label><label data-xp-label><span>'+(pct ? 'XP bar (%)' : 'XP into level')+'</span><input type="number" inputmode="decimal" min="0" name="'+key+'Value" value="'+value+'" placeholder="'+(allowUnknown ? 'Unknown' : pct ? 'e.g. 25' : 'e.g. 12000')+'" '+(!allowUnknown ? 'required' : '')+'></label></div><small data-xp-help></small></fieldset>';
  }
  function refreshFields(box, unitChanged) {
    const level = Number(box.querySelector('select[name$="Level"]').value);
    const unit = box.querySelector('select[name$="Unit"]'), input = box.querySelector('input'), pct = unit.value === 'pct';
    const newCap = cap(level), oldCap = Number(box.dataset.cap || newCap);
    const oldUnit = box.dataset.unit;
    if (unitChanged && oldUnit && oldUnit !== unit.value && input.value !== '' && oldCap && Number.isFinite(Number(input.value))) {
      input.value = pct ? String(Number((100 * Number(input.value) / oldCap).toFixed(2))) : String(Math.min(newCap - 1, Math.round(Number(input.value) * newCap / 100)));
    }
    unit.disabled = level === 60;
    input.disabled = level === 60;
    if (level === 60) input.value = 0;
    input.step = pct ? 'any' : '1';
    input.max = pct ? '99.99999' : String(Math.max(0, newCap - 1));
    box.querySelector('[data-xp-label] span').textContent = pct ? 'XP bar (%)' : 'XP into level';
    box.querySelector('[data-xp-help]').textContent = level === 60 ? 'Level cap reached.' :
      (pct ? 'Percent values produce approximate XP estimates.' : 'Read your current XP out of '+num.format(newCap)+' on the in-game XP bar.') +
      (box.dataset.optional === 'true' ? ' You can leave progress blank.' : '');
    box.dataset.cap = newCap;
    box.dataset.unit = unit.value;
  }
  function getPoint(form, key, optional = false) {
    const level = Number(form.elements[key+'Level'].value), pct = form.elements[key+'Unit'].value === 'pct';
    if (level === 60) return {level, xp:0, approx:false};
    const raw = form.elements[key+'Value'].value;
    if (raw === '' && optional) return {level, xp:null, approx:false};
    const val = Number(raw);
    if (!raw || !Number.isFinite(val) || val < 0 || (pct ? val >= 100 : (!Number.isInteger(val) || val >= cap(level)))) throw new Error('Enter valid progress within the selected level.');
    return {level, xp:pct ? Math.min(cap(level)-1, Math.round(cap(level)*val/100)) : val, approx:pct};
  }
  function contextFields(defaultRoute = route()) {
    const mode = modes.includes(defaultRoute.type) ? defaultRoute.type : 'Questing';
    return '<div class="tk-row"><label>Activity<select name="mode">'+modes.map(m=>'<option'+selected(m,mode)+'>'+m+'</option>').join('')+'</select></label><label>Route or zone<input name="zone" maxlength="100" placeholder="e.g. Tanaris" value="'+e(defaultRoute.title || defaultRoute.zone || '')+'" required></label></div>';
  }
  const button = (text, primary = true, attr = '') => '<button type="button" class="tk-btn '+(primary?'tk-primary':'tk-secondary')+'" '+attr+'>'+e(text)+'</button>';
  function formShell(content, submit, foot = '') {
    return '<form id="tk-form" class="tk-form">'+content+'<p class="tk-error" aria-live="polite"></p><div class="tk-actions">'+foot+'<button type="submit" class="tk-btn tk-primary">'+e(submit)+'</button></div></form>';
  }
  function bindForm(handler) {
    const form = document.getElementById('tk-form');
    if (!form) return;
    form.querySelectorAll('[data-snapshot]').forEach(b => {
      refreshFields(b, false);
      b.addEventListener('change', event => refreshFields(b, event.target.name.endsWith('Unit')));
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      try { await handler(form); close(); }
      catch (err) { form.querySelector('.tk-error').textContent = err.message; }
      finally { btn.disabled = false; }
    });
  }
  const money = copper => copper == null ? 'Unrecorded' : (copper<0 ? '−' : '') +
    Math.floor(Math.abs(copper)/10000)+'g '+Math.floor(Math.abs(copper)%10000/100)+'s '+Math.abs(copper)%100+'c';
  const sumKnown=(runs,key)=>{const known=runs.filter(r=>Number.isFinite(r[key]));return known.length?known.reduce((sum,r)=>sum+r[key],0):null;};
  function wallet(key, label, copper = null) {
    const v=copper==null ? '' : String(copper/10000);
    return '<label>'+label+' <span class="tk-optional">(gold)</span><input name="'+key+'" type="number" min="0" step=".0001" value="'+e(v)+'" placeholder="12.3456"></label>';
  }
  function weapon(value = '') {
    return '<label>Equipped main hand<input name="weapon" maxlength="120" value="'+e(value)+'" placeholder="Weapon name"></label>';
  }
  function optionalNumber(input,max,integer=false) {
    if(!input || input.value==='')return null;
    const n=Number(input.value);
    if(!Number.isFinite(n) || n<0 || n>max || (integer&&!Number.isInteger(n)))throw new Error('Check your optional measurements. Values must be nonnegative and within the session duration.');
    return n;
  }
  const copperValue=input=>{const n=optionalNumber(input,1e8);return n==null ? null : Math.round(n*10000);};
  function loadout(form,walletKey) {return {copper:copperValue(form.elements[walletKey]),weapon:form.elements.weapon?.value.trim() || null};}
  function extrasHtml(showOpening=false, defaultWeapon='') {
    return '<details class="tk-optional-fields"><summary>Gold, weapon &amp; PvP <span>optional</span></summary><div class="tk-extra-grid">'+
      (showOpening?wallet('openingGold','Opening wallet'):'')+wallet('endGold','Ending wallet')+weapon(defaultWeapon)+
      '<label>PvP downtime (min)<input type="number" name="pvp" min="0" step="any" placeholder="Minutes lost"></label>'+
      '<label>Total deaths<input type="number" name="deaths" min="0" step="1" placeholder="All causes"></label>'+
      '<label>Deaths from PvP<input type="number" name="pvpDeaths" min="0" step="1" placeholder="Player-caused"></label>'+
      '</div><small>Enter 0 for a measured zero. Leave unmeasured fields blank. Wallet changes include purchases, sales and repairs.</small></details>';
  }
  function extras(form,record,opening) {
    const ending=copperValue(form.elements.endGold);
    const deaths=optionalNumber(form.elements.deaths,1000000,true),pvpDeaths=optionalNumber(form.elements.pvpDeaths,1000000,true);
    if(deaths!=null && pvpDeaths!=null && pvpDeaths>deaths)throw new Error('PvP deaths cannot exceed the total number of deaths.');
    Object.assign(record,{openingCopper:opening ?? null,endingCopper:ending,netCopper:opening!=null&&ending!=null?ending-opening:null,
      weapon:form.elements.weapon?.value.trim() || null,pvpMinutes:optionalNumber(form.elements.pvp,record.ms/60000),deaths,pvpDeaths});
  }
  function updateFromRun(s,r) {
    s.profile={...s.profile,...r.finish,copper:r.endingCopper ?? s.profile.copper ?? null,weapon:r.weapon || s.profile.weapon || null};
    s.profileAt=r.endAt;
  }
  const hourIn=(ms,tz)=>new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',hourCycle:'h23'}).format(ms);
  const clockIn=(ms,tz)=>new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(ms);
  const inMorning=ms=>hourIn(ms,'Europe/Brussels')==='05';
  const method=r=>r.source==='addon' ? 'Addon import' : r.manual?'Manual':'Live timer';
  function noOverlap(s,r) {
    if(s.runs.some(existing=>existing.startAt<r.endAt && existing.endAt>r.startAt)||(s.active && s.active.startAt<r.endAt))
      throw new Error('That time overlaps another session. Check your log and any running timer.');
  }
  function edit() {
    const state = read();
    modal('Update character progress', formShell(tip('Copy your current level and XP from the in-game experience bar.')+snapshotFields('now','Current progress',state.profile,true)+'<div class="tk-row">'+wallet('wallet','Current wallet',state.profile.copper)+weapon(state.profile.weapon)+'</div>'+tip('Gold uses four decimals. For example, 12g 34s 56c is 12.3456.'),'Save progress'));
    bindForm(async form => {
      const point = getPoint(form,'now',true);
      await change(s => { s.profile = {...point,...loadout(form,'wallet')}; s.profileAt=Date.now(); });
    });
  }
  function start() {
    const state = read();
    if (state.active) return activeDialog();
    if (state.profile.level >= 60) {
      modal('Level 60 reached', '<div class="tk-form"><p>Laymer has reached the campaign goal. Your completed sessions remain available in the session log.</p></div>');
      return;
    }
    const text = tip('Start the clock before you travel or look for a group. If you leave opening XP blank, you can enter the session XP from your addon when you finish.');
    modal('Start a session', formShell(text+contextFields()+snapshotFields('start','Starting progress',state.profile,true)+'<details class="tk-optional-fields"><summary>Opening wallet &amp; weapon <span>optional</span></summary><div class="tk-extra-grid">'+wallet('openingGold','Opening wallet',state.profile.copper)+weapon(state.profile.weapon)+'</div></details>', 'Start timer'));
    bindForm(async form => {
      const point = getPoint(form,'start',true);
      if (point.level === 60) throw new Error('Choose a starting level below 60.');
      const zone = form.zone.value.trim();
      if (!zone) throw new Error('Enter your route or zone.');
      await change(s => {
        if (s.active) throw new Error('A session is already running. Close this window and open the live timer.');
        const opening=loadout(form,'openingGold');
        s.profile = {...s.profile,...point,...opening}; s.profileAt=Date.now();
        s.active = {id:id(), startAt:Date.now(), start:point, openingCopper:opening.copper, weapon:opening.weapon, mode:form.mode.value, zone};
      });
    });
  }
  function timerText(startAt) {
    const seconds = Math.max(0, Math.floor((Date.now()-startAt)/1000));
    return [Math.floor(seconds/3600), Math.floor(seconds/60)%60, seconds%60].map(s=>String(s).padStart(2,'0')).join(':');
  }
  const pointLabel = p => 'Lv. '+p.level+(p.level === 60 || p.xp===null ? '' : ' · '+(p.approx?'≈ ':'')+num.format(p.xp)+' XP');
  function runRecord(active, finish, ms, ended, notes, manual) {
    const gain = total(finish) - total(active.start);
    if (gain < 0) throw new Error('Ending progress must equal or exceed starting progress.');
    if (!(ms > 0)) throw new Error('Elapsed time must be greater than zero.');
    return {id:active.id, startAt:ended-ms, endAt:ended, ms, start:active.start, finish, mode:active.mode, zone:active.zone, notes, manual, gain, approx:!!(active.start.approx || finish.approx)};
  }
  const noteField = '<label>Session notes <span class="tk-optional">(optional)</span><textarea name="notes" maxlength="500" rows="2" placeholder="Rested XP, group wait, contested pulls…"></textarea></label>';
  function activeDialog() {
    const s = read(), active = s.active;
    if (!active) return start();
    const header = '<div class="tk-live"><span class="tk-dot"></span>Timer running<strong data-timer="'+active.startAt+'">'+timerText(active.startAt)+'</strong></div>'+tip(e(active.mode)+' · '+e(active.zone)+' · Started at '+e(pointLabel(active.start)));
    const opening = active.start.xp === null ? '<label>XP measurement<select name="measure"><option value="opening">Enter opening XP</option><option value="addon">Use XP earned from my addon</option></select></label><div data-opening>'+snapshotFields('opening','Opening progress',active.start)+'</div><label data-addon hidden>Session XP earned<input name="earned" type="number" min="0" step="1" disabled></label>' : '';
    modal('Live session',formShell(header+opening+snapshotFields('finish','Ending progress',{level:Math.max(active.start.level,s.profile.level),xp:null})+extrasHtml(active.openingCopper==null,active.weapon)+noteField,'Finish & save',button('Discard timer',false,'data-tk="discard"')));
    bindForm(async form => {
      const finish = getPoint(form,'finish');
      let startPoint = active.start;
      if (opening && form.elements.measure.value === 'addon') {
        const earned = Number(form.earned.value);
        const inferred = total(finish) - earned - cumulative[active.start.level - 46];
        if (!Number.isSafeInteger(earned) || earned < 0 || !Number.isInteger(inferred) || inferred < 0 || inferred >= cap(active.start.level))
          throw new Error('The session XP and ending progress do not fit your opening level. Check both values.');
        startPoint = {level:active.start.level, xp:inferred, approx:finish.approx};
      } else if (opening) {
        startPoint = getPoint(form,'opening');
      }
      const endAt = Date.now();
      const record = runRecord({...active, start:startPoint}, finish, endAt-active.startAt, endAt, form.notes.value.trim(), false);
      extras(form,record,active.openingCopper ?? copperValue(form.elements.openingGold));
      await change(state => {
        if (state.active?.id !== active.id) throw new Error('This timer has already been closed in another tab.');
        state.runs.push(record); updateFromRun(state,record); state.active = null;
      });
    });
    if (opening) {
      const f=document.getElementById('tk-form'), first=f.querySelector('[data-opening]'), addon=f.querySelector('[data-addon]');
      // The live timer already recorded the opening level.
      f.elements.openingLevel.disabled=true;
      f.elements.measure.addEventListener('change',()=>{
        const useAddon=f.elements.measure.value==='addon';
        first.hidden=useAddon; addon.hidden=!useAddon;
        f.elements.openingUnit.disabled=useAddon;
        f.elements.openingValue.disabled=useAddon;
        f.elements.earned.disabled=!useAddon;
        f.elements.earned.required=useAddon;
      });
    }
  }
  function localInput(d) {
    const pad = v => String(v).padStart(2,'0');
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
  }
  function manual() {
    const s = read(), now = localInput(new Date());
    const text = tip('Record a completed session using the full time from first travel to final hand-in.');
    const fields = '<div class="tk-row"><label>Ended at <span class="tk-optional">(device time)</span><input name="endDate" type="datetime-local" value="'+now+'" max="'+now+'" required></label><label>Elapsed minutes<input name="minutes" type="number" step="any" min="0.01" max="10080" placeholder="60" required></label></div>';
    modal('Log a past session',formShell(text+contextFields({})+fields+snapshotFields('start','Starting progress',{level:s.profile.level===60 ? 59 : s.profile.level,xp:null})+snapshotFields('finish','Ending progress',s.profile)+extrasHtml(true)+noteField+
      '<label class="tk-check"><input type="checkbox" name="updateProfile"> Also use ending progress as my current character progress</label>','Save session'));
    bindForm(async form => {
      const ended = new Date(form.endDate.value).getTime();
      const ms = Math.round(Number(form.minutes.value)*60000);
      if (!Number.isFinite(ended) || ended > Date.now()) throw new Error('Choose an end time in the past.');
      const start = getPoint(form,'start'), finish = getPoint(form,'finish');
      if (start.level === 60) throw new Error('Choose a starting level below 60.');
      const zone = form.zone.value.trim();
      if (!zone) throw new Error('Enter your route or zone.');
      const rec = runRecord({id:id(),start,zone,mode:form.mode.value},finish,ms,ended,form.notes.value.trim(),true);
      extras(form,rec,copperValue(form.elements.openingGold));
      await change(st => {
        noOverlap(st,rec);
        st.runs.push(rec);
        if (form.updateProfile.checked) updateFromRun(st,rec);
      });
    });
  }
  function confirmDiscard() {
    const active = read().active;
    if (!active) return close();
    modal('Discard this timer?',formShell('<p>The running timer for '+e(active.zone)+' will be cleared without adding a session.</p>','Discard timer',button('Keep running',false,'data-tk="active"')));
    bindForm(() => change(s => { if (s.active?.id === active.id) s.active = null; }));
  }
  function confirmDelete(runId) {
    const run = read().runs.find(r=>r.id===runId); if (!run) return close();
    modal('Delete this session?',formShell('<p>Remove '+e(run.zone)+' from your log and pace calculations? Your current character progress is saved separately.</p>','Delete session',button('Cancel',false,'data-tk="close"')));
    bindForm(() => change(s=>{s.runs=s.runs.filter(r=>r.id!==runId);}));
  }
  function details(runId) {
    const r = read().runs.find(item => item.id === runId);
    if (!r) return;
    const rows = [['Activity',r.mode],['Method',method(r)],['Started (Brussels)',clockIn(r.startAt,'Europe/Brussels')],['Started (New York / Los Angeles)',clockIn(r.startAt,'America/New_York')+' / '+clockIn(r.startAt,'America/Los_Angeles')],['Starting progress',pointLabel(r.start)],['Ending progress',pointLabel(r.finish)],['Elapsed time',fmtTime(r.ms)],['XP gained',(r.approx?'≈ ':'')+num.format(r.gain)],['All-in pace',precise(r)+' XP/h'],['Wallet change',money(r.netCopper)],['Ending wallet',money(r.endingCopper)],['Main-hand weapon',r.weapon || 'Unrecorded'],['PvP downtime',r.pvpMinutes==null?'Unrecorded':num.format(r.pvpMinutes)+' min'],['Deaths (all / PvP)',(r.deaths ?? '—')+' / '+(r.pvpDeaths ?? '—')]];
    modal(r.zone, '<div class="tk-form"><p class="tk-hint">'+e(dateFormat.format(r.endAt))+' · Brussels date</p><dl class="tk-pairs">'+rows.map(([k,v])=>'<div><dt>'+e(k)+'</dt><dd>'+e(v)+'</dd></div>').join('')+'</dl>'+(r.notes ? '<p class="tk-note">'+e(r.notes)+'</p>' : '')+'<div class="tk-actions">'+button('Delete session',false,'data-tk="delete" data-id="'+e(r.id)+'"')+button('Done',true,'data-tk="close"')+'</div></div>');
  }
  function importAddon() {
    modal('Import an addon session',formShell(tip('Open the Warrior Atlas addon in game, copy a completed session export, and paste it below. Each export adds one session.')+
      '<label>Addon export<textarea name="payload" rows="6" maxlength="32000" required spellcheck="false" placeholder="Paste your WarriorAtlas JSON"></textarea></label>'+
      '<label class="tk-check"><input type="checkbox" name="sync" checked> Update character progress from this export if it is the latest observation</label>','Import session'));
    bindForm(async form=>{
      let data;
      try{data=JSON.parse(form.payload.value.trim());}catch(_){throw new Error('Paste a complete JSON export from Warrior Atlas.');}
      const rec=decodeAddon(data);
      await change(s=>{
        if(s.runs.some(r=>r.importId===rec.importId))throw new Error('This addon session is already in your log.');
        noOverlap(s,rec);
        s.runs.push(rec);
        if(form.sync.checked && rec.endAt>=(s.profileAt||0) && rec.finish.level>=s.profile.level)updateFromRun(s,rec);
      });
    });
  }
  function decodeAddon(d) {
    if(!d || d.schema!=='warrior-atlas.session.v1' || typeof d.id!=='string' || !d.id.trim() || d.id.length>250)
      throw new Error('Unsupported export. Use a version 1 Warrior Atlas session.');
    if(typeof d.character!=='string' || !/^laymer(?:[ -]migii)?$/i.test(d.character.trim()))throw new Error('This export belongs to a different character.');
    if(d.region!=null && !['US','NA','Americas'].includes(d.region))throw new Error('This session belongs to another region.');
    if(!Number.isSafeInteger(d.startEpoch)||!Number.isSafeInteger(d.endEpoch)||d.startEpoch<=0 || d.endEpoch<=d.startEpoch ||
      d.endEpoch*1000>Date.now()+60000 || d.endEpoch-d.startEpoch>7*86400)throw new Error('Export timestamps must form a completed session of up to seven days.');
    if(!modes.includes(d.mode) || typeof d.zone!=='string' || !d.zone.trim() || d.zone.length>150)throw new Error('The export needs a valid activity and zone.');
    const start={level:d.startLevel,xp:d.startXP,approx:false},finish={level:d.endLevel,xp:d.endXP,approx:false};
    if(!valid(start)||!valid(finish)||start.level===60||start.xp==null||finish.xp==null)throw new Error('XP and levels in this export are outside the level 46–60 campaign.');
    const end=d.endEpoch*1000,rec=runRecord({id:id(),start,zone:d.zone.trim(),mode:d.mode},finish,end-d.startEpoch*1000,end,'',false);
    const n=(key,max,integer=true)=>{
      const v=d[key];if(v==null)return null;
      if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max||(integer&&!Number.isSafeInteger(v)))throw new Error('The export contains an invalid '+key+' value.');
      return v;
    };
    const opening=n('startCopper',1e12),ending=n('endCopper',1e12),deaths=n('deaths',1e6),pvpDeaths=n('pvpDeaths',1e6);
    if(deaths!=null && pvpDeaths!=null && pvpDeaths>deaths)throw new Error('PvP deaths exceed total deaths in the export.');
    if(d.weapon!=null && (typeof d.weapon!=='string'||d.weapon.length>150))throw new Error('The exported weapon name is invalid.');
    return {...rec,source:'addon',importId:d.id,openingCopper:opening,endingCopper:ending,netCopper:opening!=null&&ending!=null?ending-opening:null,
      weapon:d.weapon?.trim()||null,pvpMinutes:n('pvpMinutes',rec.ms/60000+.00001,false),pvpDeaths,deaths};
  }
  function csv() {
    const runs = read().runs.slice().sort((a,b)=>a.startAt-b.startAt);
    if (!runs.length) return;
    const rows = [['Start (UTC)','End (UTC)','Activity','Route','Start level','Start XP','End level','End XP','XP gained','XP approximate','Elapsed minutes','XP per hour','Entry method','Opening copper','Closing copper','Net copper','Weapon','PvP minutes','PvP deaths','All deaths','Brussels start','Notes']];
    for (const r of runs) rows.push([new Date(r.startAt).toISOString(),new Date(r.endAt).toISOString(),r.mode,r.zone,r.start.level,r.start.xp,r.finish.level,r.finish.xp,r.gain,r.approx,(r.ms/60000).toFixed(2),Math.round(gainRate(r)),method(r),r.openingCopper,r.endingCopper,r.netCopper,r.weapon,r.pvpMinutes,r.pvpDeaths,r.deaths,clockIn(r.startAt,'Europe/Brussels'),r.notes]);
    const cell = x => { const raw=String(x ?? ''); return '"'+(/^[=+@\-\t\r]/.test(raw) ? "'" : '')+raw.replace(/"/g,'""')+'"'; };
    const url=URL.createObjectURL(new Blob([rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='laymer-migii-sessions.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function byMode(runs) {
    const map=new Map();
    for (const r of runs) {
      const item=map.get(r.mode) || {mode:r.mode,ms:0,gain:0,count:0};
      item.ms+=r.ms;item.gain+=r.gain;item.count++;map.set(r.mode,item);
    }
    return Array.from(map.values()).sort((a,b)=>gainRate(b)-gainRate(a));
  }
  // A comparison needs two morning samples per route and two eligible routes.
  // Prefer exact route titles. A zone alone identifies a route only if its activity
  // uniquely resolves it across the full route catalog.
  function preferredRoute(routes, benchmarkId) {
    const state=read(), level=state.profile.level;
    if (!Array.isArray(routes) || level>=60) return null;
    const normalize=text=>String(text || '').normalize('NFKC').replace(/[‘’]/g,"'").trim().replace(/\s+/g,' ').toLowerCase();
    const groups=new Map();
    for (const run of state.runs) {
      if (!run.start || Math.abs(run.start.level-level)>2 || !inMorning(run.startAt) || !(run.ms>0)) continue;
      const name=normalize(run.zone), mode=normalize(run.mode);
      if (!name || !mode) continue;
      const matchingMode=routes.filter(r=>normalize(r.type)===mode);
      const named=matchingMode.filter(r=>normalize(r.title)===name);
      const matches=named.length?named:matchingMode.filter(r=>normalize(r.zone)===name);
      if (matches.length!==1) continue;
      const candidate=matches[0];
      if (level<candidate.min || level>candidate.max) continue;
      const g=groups.get(candidate.id)||{id:candidate.id,count:0,ms:0,gain:0};
      g.count++;g.ms+=run.ms;g.gain+=run.gain;groups.set(candidate.id,g);
    }
    const ranked=Array.from(groups.values()).filter(g=>g.count>=2).sort((a,b)=>gainRate(b)-gainRate(a));
    if (benchmarkId && !ranked.some(group => group.id === benchmarkId)) return null;
    if (ranked.length<2 || gainRate(ranked[0])<=gainRate(ranked[1])) return null;
    return {id:ranked[0].id,count:ranked[0].count,pace:gainRate(ranked[0]),compared:ranked.length};
  }
  function promptContext() {
    const {profile, profileAt, runs} = read();
    const morning = runs.filter(run => inMorning(run.startAt) && run.ms > 0);
    const ms = morning.reduce((sum, run) => sum + run.ms, 0);
    const gain = morning.reduce((sum, run) => sum + run.gain, 0);
    const latest = runs.reduce((last, run) => !last || run.endAt > last.endAt ? run : last, null);
    return {profile, profileAt, latest, count: morning.length, pace: ms ? gain * 3600000 / ms : null};
  }
  function fieldReport(runs) {
    if(!runs.length)return '';
    const morning=runs.filter(r=>inMorning(r.startAt));
    const groups=new Map();
    for(const r of runs) {
      const key=r.zone.toLocaleLowerCase()+'|'+r.mode;
      const group=groups.get(key)||{zone:r.zone,mode:r.mode,runs:[]};
      group.runs.push(r);groups.set(key,group);
    }
    const compare=Array.from(groups.values()).map(g=>{
      const ms=g.runs.reduce((n,r)=>n+r.ms,0);
      const gain=g.runs.reduce((n,r)=>n+r.gain,0);
      const wallets=g.runs.filter(r=>r.netCopper!=null);
      const goldMs=wallets.reduce((n,r)=>n+r.ms,0);
      const pvp=g.runs.filter(r=>r.pvpMinutes!=null),pvpMs=pvp.reduce((n,r)=>n+r.ms,0);
      return {...g,rate:gain*3600000/ms,gold:goldMs ? sumKnown(wallets,'netCopper')/10000*3600000/goldMs : null,
        pvpPercent:pvpMs?sumKnown(pvp,'pvpMinutes')*6000000/pvpMs:null,pvpDeaths:sumKnown(g.runs,'pvpDeaths'),
        morning:g.runs.filter(r=>inMorning(r.startAt)).length,weapons:[...new Set(g.runs.map(r=>r.weapon).filter(Boolean))]};
    }).sort((a,b)=>b.rate-a.rate);
    const catalog=window.Routes?.items || [];
    const best=preferredRoute(catalog), leader=best && catalog.find(r=>r.id===best.id);
    const advice=leader ? e(leader.title)+' leads '+best.compared+' eligible routes at '+num.format(Math.round(best.pace))+' XP/h across '+best.count+' comparable morning sessions. Recheck after equipment or PvP conditions change.' :
      'To recommend a route, the atlas needs at least two morning runs on each of two eligible routes, within two levels of your character. Record an exact route name when a zone has multiple routes for the same activity.';
    return '<section class="tk-panel tk-fieldreport"><div class="tk-panelhead"><h2>Route comparisons</h2><span class="tk-sample">'+morning.length+' morning session'+(morning.length===1?'':'s')+'</span></div>'+
      '<p class="tk-recommend">'+advice+'</p><div class="tk-tablewrap"><table class="tk-table"><thead><tr><th>Route</th><th>XP/hour</th><th>Net gold/hour</th><th>PvP time</th><th>PvP deaths</th><th>Main hand observed</th><th>Morning / total</th></tr></thead><tbody>'+
      compare.map(g=>'<tr><td><strong>'+e(g.zone)+'</strong><small>'+e(g.mode)+'</small></td><td>'+num.format(Math.round(g.rate))+'</td><td>'+(g.gold==null?'—':num.format(Number(g.gold.toFixed(2)))+'g')+'</td><td>'+(g.pvpPercent==null?'—':num.format(Number(g.pvpPercent.toFixed(1)))+'%')+'</td><td>'+(g.pvpDeaths??'—')+'</td><td>'+e(g.weapons.join(', ')||'—')+'</td><td>'+g.morning+' / '+g.runs.length+'</td></tr>').join('')+
      '</tbody></table></div><p class="tk-caption">Morning runs start from 05:00 to 05:59 Brussels local time. Gold and PvP rates use only runs with those measurements. Weapon changes, rested XP and party composition can affect comparisons.</p></section>';
  }
  let logHost;
  function render(host) {
    logHost=host;
    const state=read(), s=summary(), runs=state.runs.slice().sort((a,b)=>b.endAt-a.endAt);
    const best=runs.length ? Math.max(...runs.map(gainRate)) : null;
    const totalTime=runs.reduce((a,r)=>a+r.ms,0);
    const activity=byMode(runs), max=activity.length ? Math.max(1,gainRate(activity[0])) : 1;
    const recent=runs.slice(0,5).reverse(), largestRecent=Math.max(1,...recent.map(gainRate));
    const stamp=n => n===null ? '—' : num.format(Math.round(n));
    const metric=(label,value,small)=>'<article class="tk-metric"><span>'+label+'</span><strong>'+e(value)+'</strong><small>'+e(small)+'</small></article>';
    const head='<header class="tk-head"><div><p class="tk-kicker">CAMPAIGN JOURNAL</p><h1>Session log</h1><p>Measure the full trip, from first pull to final hand-in.</p></div><div class="tk-head-actions">'+button('Import addon',false,'data-tk="import"')+button('Log past session',false,'data-tk="manual"')+button(s.active?'Open live timer':'Start session',true,'data-tk="start"')+'</div></header>';
    const live=state.active ? '<button class="tk-activebar" data-tk="active"><span><i class="tk-dot"></i> Timer running · '+e(state.active.zone)+'</span><strong data-timer="'+state.active.startAt+'">'+timerText(state.active.startAt)+'</strong></button>' : '';
    const metrics='<section class="tk-metrics">'+metric('Logged time',runs.length ? fmtTime(totalTime) : '0 min',runs.length+' completed session'+(runs.length===1?'':'s'))+metric('Weighted pace',stamp(s.pace),'XP per elapsed hour')+metric('Best session',stamp(best),'XP per elapsed hour')+metric('Time to level 60',s.level===60?'Reached':s.etaHours===null?'—':((s.remainingIsUpperBound?'≤ ':'≈ ')+fmtTime(s.etaHours*3600000)),s.level===60?'Campaign complete':s.pace>0?'At your logged pace':'Requires measured XP/hour')+'</section>';
    const logBody=runs.length ? '<div class="tk-tablewrap"><table class="tk-table"><thead><tr><th>Route or zone</th><th>Activity</th><th>Elapsed</th><th>XP gained</th><th>XP/hour</th><th></th></tr></thead><tbody>'+runs.map(r=>'<tr><td><strong>'+e(r.zone)+'</strong><small>'+e(dateFormat.format(r.endAt))+' · '+method(r)+'</small></td><td>'+e(r.mode)+'</td><td>'+e(fmtTime(r.ms))+'</td><td>'+(r.approx?'≈ ':'')+num.format(r.gain)+'</td><td>'+precise(r)+'</td><td><button class="tk-link" data-tk="detail" data-id="'+e(r.id)+'">View</button></td></tr>').join('')+'</tbody></table></div>' :
      '<div class="tk-empty"><span aria-hidden="true">'+(window.Atlas?.icon?.('book',30)||'✧')+'</span><h3>Your journal starts here.</h3><p>Start a timer or log a past run to measure your pace.</p>'+button('Log a past session',false,'data-tk="manual"')+'</div>';
    const history='<section class="tk-panel"><div class="tk-panelhead"><h2>Session history</h2>'+(runs.length?'<button class="tk-link" data-tk="export">Export CSV ↓</button>':'')+'</div>'+logBody+'</section>';
    const analytics=activity.length ? '<div class="tk-analysis"><section class="tk-panel"><div class="tk-panelhead"><h2>Pace by activity</h2></div><div class="tk-bars">'+activity.map(a=>'<div><div class="tk-barrow"><strong>'+e(a.mode)+'</strong><span>'+num.format(Math.round(gainRate(a)))+' XP/h · '+a.count+' run'+(a.count===1?'':'s')+'</span></div><div class="tk-track"><i style="width:'+Math.round(100*gainRate(a)/max)+'%"></i></div></div>').join('')+'</div></section><section class="tk-panel"><div class="tk-panelhead"><h2>Recent pace</h2></div><div class="tk-bars">'+recent.map(r=>'<div><div class="tk-barrow"><strong>'+e(r.zone)+'</strong><span>'+precise(r)+' XP/h</span></div><div class="tk-track"><i style="width:'+Math.round(100*gainRate(r)/largestRecent)+'%"></i></div></div>').join('')+'</div><p class="tk-caption">Last five sessions, oldest first.</p></section></div>':'';
    host.innerHTML='<div class="tk-journal">'+head+live+metrics+history+fieldReport(runs)+analytics+'<p class="tk-footnote">XP/hour divides total earned XP by total elapsed hours, including travel, group waits and breaks. Percentage entries are approximate. Sessions are stored in this browser. <a href="https://gearinsight.app/wow/en/forever/xp" target="_blank" rel="noopener noreferrer">Forever XP curve ↗</a></p></div>';
  }
  document.addEventListener('click', event => {
    const b=event.target.closest?.('[data-tk]'); if(!b)return;
    const action=b.dataset.tk;
    ({manual,start,import:importAddon,active:activeDialog,discard:confirmDiscard,delete:()=>confirmDelete(b.dataset.id),detail:()=>details(b.dataset.id),close,export:csv}[action])?.();
  });
  setInterval(()=>{document.querySelectorAll('[data-timer]').forEach(n=>{n.textContent=timerText(Number(n.dataset.timer));});},1000);
  window.Tracker={render,start,edit,activeDialog,summary,manual,importAddon,preferredRoute,promptContext};
})();
