const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function verifyTheme(page, root) {
  const toggle = page.getByRole('button', {name: 'Dark mode', exact: true});
  async function expectTheme(theme) {
    await page.waitForSelector('html[data-theme="' + theme + '"]', {timeout: 3000});
    assert.equal(await toggle.getAttribute('aria-pressed'), String(theme === 'dark'));
  }
  const background = locator => locator.evaluate(node => getComputedStyle(node).backgroundColor);
  const key = 'warrior-atlas:theme';
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto(root);
  await expectTheme('light');
  const lightCard = await background(page.locator('.checkpoint'));
  await page.emulateMedia({colorScheme: 'dark'});
  await expectTheme('dark');
  assert.notEqual(await background(page.locator('.checkpoint')), lightCard);

  await toggle.focus();
  await page.keyboard.press('Space');
  await expectTheme('light');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), 'light');
  await page.reload();
  await expectTheme('light');
  await page.emulateMedia({colorScheme: 'light'});
  await page.emulateMedia({colorScheme: 'dark'});
  await expectTheme('light');

  await toggle.click();
  await page.emulateMedia({colorScheme: 'light'});
  await page.goto(root + '#grinding');
  await page.reload();
  await expectTheme('dark');
  assert.equal(await page.locator('h1').innerText(), 'Grinding tips');
  await page.getByRole('button', {name: 'Companion addon'}).click();
  const dialog = page.getByRole('dialog');
  const darkDialog = await background(dialog);
  assert.equal(await dialog.evaluate(node => getComputedStyle(node).colorScheme), 'dark');
  await page.keyboard.press('Escape');
  await toggle.click();
  await expectTheme('light');
  await page.getByRole('button', {name: 'Companion addon'}).click();
  assert.notEqual(await background(dialog), darkDialog);
  await page.keyboard.press('Escape');
  await page.evaluate(key => localStorage.removeItem(key), key);
}

async function verify(page, root) {
  const journal = 'warrior-atlas:laymer-migii:journal:v1';
  const view = page.locator('#view h1');
  await page.goto(root);
  for (const width of [851, 1151, 1280, 1321, 1501, 320]) {
    await page.setViewportSize({width, height: 720});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
  assert.equal(await view.innerText(), 'Dunemaul Compound');
  await page.getByRole('button', {name: 'Done', exact: true}).focus();
  await page.keyboard.press('Enter');
  assert.equal(await view.innerText(), 'Deadwood Village');
  await page.reload();
  await page.getByRole('button', {name: 'Undo'}).click();
  assert.equal(await view.innerText(), 'Dunemaul Compound');
  await page.evaluate(() => localStorage.clear());
  const bands = ['Dunemaul Compound', 'Dunemaul Compound', 'Dunemaul Compound',
    'Deadwood Village', 'Deadwood Village', 'Deadwood Village', 'Fungal Rock',
    'Fungal Rock', 'Felstone Field', 'Felstone Field', 'Ice Thistle Hills',
    'Ice Thistle Hills', 'Ice Thistle den', 'Ice Thistle den', 'Level 60 reached'];
  for (const [offset, expected] of bands.entries()) {
    const record = JSON.stringify({profile: {level: 46 + offset, xp: 0}, runs: [], active: null});
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [journal, record]);
    await page.reload();
    assert.equal(await view.innerText(), expected);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), journal), record);
  }
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  for (let i = 0; i < 6; i++) await page.getByRole('button', {name: 'Done', exact: true}).click();
  assert.equal(await view.innerText(), 'Final checkpoint complete');
  await page.reload();
  await page.getByRole('button', {name: 'Undo'}).click();
  assert.equal(await view.innerText(), 'Ice Thistle den');
  await page.evaluate(() => localStorage.clear());
  await page.goto(root + '#journal');
  const end = Math.floor(Date.now() / 1000) - 60;
  const payload = {schema: 'warrior-atlas.session.v1', id: 'browser-test', character: 'Laymer',
    startEpoch: end - 600, endEpoch: end, mode: 'Grinding', zone: 'Tanaris',
    startLevel: 46, endLevel: 46, startXP: 0, endXP: 1000, deaths: 1};
  await page.getByRole('button', {name: 'Import addon'}).click();
  await page.getByLabel('Addon export').fill(JSON.stringify(payload));
  await page.getByRole('button', {name: 'Import session'}).click();
  await page.waitForSelector('dialog', {state: 'hidden'});
  await page.reload();
  const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), journal);
  assert.equal(state.runs[0].gain, 1000);
  assert.equal(state.runs[0].deaths, 1);
  assert.equal(state.profile.xp, 1000);
  const morning = Date.UTC(2026, 10, 20, 4);
  for (const mode of ['Questing', 'Dungeon']) {
    const title = mode === 'Questing' ? 'Tanaris quest circuit' : 'Zul’Farrak';
    state.runs = [0, 1, 2, 3].map(i => ({...state.runs[0],
      mode: i < 2 ? 'Grinding' : mode, zone: i < 2 ? 'Tanaris' : title,
      gain: i < 2 ? 1000 : 2000, startAt: morning + i * 600000}));
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [journal, JSON.stringify(state)]);
    await page.goto(root);
    assert.equal(await view.innerText(), title);
    assert.match(await page.locator('#view').innerText(), /12,000 XP\/hour/);
  }
  await page.goto(root + '#grinding');
  assert.equal(await view.innerText(), 'Grinding tips');
  assert.equal(await page.locator('.field-guide section').count(), 6);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  for (const slug of ['overview', 'routes', 'dungeons', 'research', 'journal', 'checkpoint']) {
    await page.locator('#nav a[href="#' + slug + '"]').click();
    await page.waitForSelector('#nav a[aria-current="page"][href="#' + slug + '"]');
  }
  await page.getByRole('button', {name: 'Companion addon'}).click();
  const zip = page.locator('a[download][href$=".zip"]');
  assert.equal(await zip.evaluate(a => a.href), root + 'assets/WarriorAtlas.zip');
  assert.equal((await page.request.get(await zip.evaluate(a => a.href))).status(), 200);
}

(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
  try {
    const page = await browser.newPage({viewport: {width: 320, height: 720}});
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('response', response => {if (response.status() >= 400) errors.push(response.url());});
    await verifyTheme(page, process.argv[2]);
    await verify(page, process.argv[2]);
    await require("./daily-prompt.cjs")(page, process.argv[2]);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
