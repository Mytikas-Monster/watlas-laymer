(() => {
  const armory = 'https://worldofwarcraft.blizzard.com/en-us/forever/us/armory/character/laymer-migii';
  const atlas = 'https://mytikas-monster.github.io/watlas-laymer/';
  let noteDay, loginNote = '';
  let refreshOpenPrompt;
  window.addEventListener('focus', () => {
    if (document.querySelector('#prompt-text')) refreshOpenPrompt();
  });

  function progress(point) {
    const xp = point.xp == null ? 'unknown XP' : (point.approx ? 'approximately ' : '') + point.xp + ' XP';
    return 'level ' + point.level + ', ' + xp;
  }

  function prompt(day, date) {
    const {profile, profileAt, latest, pace, count} = Tracker.promptContext();
    const entered = profileAt || profile.level !== 46 || profile.xp != null;
    const source = entered ? 'Player entry (' + (profileAt ? date(profileAt) : 'date unknown') + ')' : 'Atlas default (unconfirmed)';
    const routes = Routes.items.filter(route => route.min <= profile.level && profile.level <= route.max);
    const lines = [
      'Plan my 05:00–06:00 Europe/Brussels session for ' + day + ' as Laymer Migii, Alliance Protection Warrior on US PvP.',
      'Read the live US Forever Armory at ' + armory + '. Identify the latest level, gear and professions and give the Armory update date if shown.',
      source + ': ' + progress(profile) + '.',
      latest ? 'Last completed session (' + date(latest.endAt) + '): ' + latest.zone + ', ' + latest.mode +
        ', ended at ' + progress(latest.finish) + '; ' + latest.gain + ' XP in ' + (latest.ms / 60000).toFixed(1) + ' elapsed minutes.'
        : 'Last completed session: none recorded.',
      'Morning pace (Brussels 05:00–05:59 starts): ' + (pace == null ? 'unknown' : Math.round(pace) + ' XP/hour') + ' (' + count + ' sessions).',
      'Login note for ' + day + ': ' + (loginNote.trim() || 'none supplied') + '.',
      'Atlas route planner: ' + atlas + '#routes' + (routes.length ? ' · candidates at journal level: ' + routes.map(r => r.title).join(', ') : '') +
        '. Dungeon guide: ' + atlas + '#dungeons · solo camps: ' + atlas + '#grinding.',
      'Reconcile the dated journal, login note and Armory field by field. Use newer player observations when the Armory is stale. If unavailable, use dated evidence and identify unknowns, including current XP, rested bonus and quest status.',
      'Recommend one route for my latest level, outstanding quests to check, a ready-group cutoff, mining for my skill, a PvP fallback and a stopping time by 06:00. Count travel and recruitment in elapsed XP/hour. At level 60, choose a cap-level objective suited to my gear and professions.'
    ];
    return lines.join('\n\n');
  }

  function render(host, date, refreshDate) {
    host.innerHTML = `<article class="checkpoint daily-prompt"><h1>Daily Prompt</h1>
      <p><time></time> · 05:00–06:00 Brussels</p>
      <label for="login-note">Optional login note</label>
      <textarea id="login-note" maxlength="400" rows="2" placeholder="Current zone, rested XP or quest changes"></textarea>
      <label for="prompt-text">Prompt for ChatGPT</label><textarea id="prompt-text" rows="13" readonly></textarea>
      <button class="act primary" type="button">Copy prompt</button></article>`;
    const note = host.querySelector('#login-note'), output = host.querySelector('#prompt-text');
    function refresh() {
      const day = refreshDate();
      if (noteDay !== day) { noteDay = day; loginNote = ''; }
      const time = host.querySelector('time');
      time.dateTime = day;
      time.textContent = day;
      note.value = loginNote;
      const value = prompt(day, date);
      if (output.value !== value) output.value = value;
    }
    note.oninput = () => { noteDay = date(); loginNote = note.value; refresh(); };
    host.querySelector('button').onclick = async () => {
      refresh();
      try {
        await navigator.clipboard.writeText(output.value);
        Atlas.notice('Prompt copied.');
      } catch {
        output.focus();
        output.select();
        Atlas.notice('Prompt selected. Use your device’s Copy command.');
      }
    };
    refreshOpenPrompt = refresh;
    refresh();
  }
  window.DailyPrompt = {render};
})();
