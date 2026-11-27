const assert = require('node:assert/strict');

module.exports = async function verifyDailyPrompt(page, root) {
  const key = 'warrior-atlas:laymer-migii:journal:v1';
  const at = value => page.clock.setFixedTime(new Date(value));
  await at('2026-03-28T22:59:00Z');
  await page.goto(root);
  await page.evaluate(() => localStorage.clear());
  await page.getByRole('link', {name: 'Daily Prompt'}).focus();
  await page.keyboard.press('Enter');
  const output = page.getByLabel('Prompt for ChatGPT');
  const note = page.getByLabel('Optional login note');
  const copy = page.getByRole('button', {name: 'Copy prompt'});
  assert.match(await output.inputValue(), /Atlas default \(unconfirmed\): level 46, unknown XP/);
  assert.match(await output.inputValue(), /unknown \(0 sessions\)/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);

  await note.fill('Tanaris, rested');
  await page.keyboard.press('Tab');
  assert.equal(await output.evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await copy.evaluate(el => el === document.activeElement), true);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await at('2026-03-28T23:00:00Z');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#notice').textContent === 'Prompt copied.');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await output.inputValue());
  assert.match(await output.inputValue(), /2026-03-29/);
  assert.equal(await note.inputValue(), '');
  assert.equal(await page.locator('#dateline').getAttribute('datetime'), '2026-03-29');

  const summer = Date.parse('2026-03-29T03:00:00Z');
  const winter = Date.parse('2026-10-25T04:00:00Z');
  const run = {zone: 'Tanaris', mode: 'Questing', finish: {level: 47, xp: 3000}, ms: 1800000, gain: 3000};
  const runs = [winter, summer, winter - 3600000].map(startAt => ({...run, startAt, endAt: startAt + run.ms}));
  runs[0].gain = 9000;
  runs[0].ms = 3600000;
  runs[0].endAt = winter + runs[0].ms;
  const state = {profile: {level: 53, xp: 500}, profileAt: Date.parse('2026-10-26T02:00:00Z'), runs};
  await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [key, state]);
  await at('2026-10-26T04:00:00Z');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  const text = await output.inputValue();
  assert.match(text, /Player entry \(2026-10-26\): level 53, 500 XP/);
  assert.match(text, /Last completed session \(2026-10-25\): Tanaris/);
  assert.match(text, /8000 XP\/hour \(2 sessions\)/);
  assert.match(text, /newer player observations when the Armory is stale/);

  state.profile = {level: 60, xp: 0};
  await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [key, state]);
  await page.goto(root + '#research');
  await page.goto(root + '#daily-prompt');
  assert.match(await output.inputValue(), /level 60, 0 XP/);
  assert.match(await output.inputValue(), /choose a cap-level objective/);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true}));
  await copy.click();
  assert.equal(await output.evaluate(el => el.selectionStart === 0 && el.selectionEnd === el.value.length), true);
};
