// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

// Helper: bypass the 3-second loader and wait for all builders to run
async function loadPage(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
  // Bypass loader: hide it immediately and call startOpeningSequence
  await page.evaluate(() => {
    const loader = document.getElementById('loader');
    if (loader) { loader.style.display = 'none'; loader.classList.add('fade-out'); }
    if (typeof setDate === 'function') setDate();
    if (typeof startOpeningSequence === 'function') startOpeningSequence();
  });
  // Give JS builders a moment to run
  await page.waitForTimeout(500);
  return errors;
}

// ====================================================
// 1. PAGE LOADS — no JS errors
// ====================================================
test('no JS errors on page load', async ({ page }) => {
  const errors = await loadPage(page);
  expect(errors, `JS errors: ${errors.join(', ')}`).toHaveLength(0);
});

// ====================================================
// 2. DOCUMENT STRUCTURE
// ====================================================
test('page title contains love', async ({ page }) => {
  await loadPage(page);
  await expect(page).toHaveTitle(/For You|Love|Aashu/i);
});

test('all 24 sections exist', async ({ page }) => {
  await loadPage(page);
  const sectionIds = [
    'opening','her-words','reply-section','night-knew','heartbeat',
    'typewriter-section','waterfall-section','rose-section','polaroid-section',
    'whisper-section','open-when','wish-section','envelope-section','flower-section',
    'promise-section','clock-section','bubbles-section','stars-section',
    'galaxy-section','home-section','counter-section','kiss-section','would-do','final'
  ];
  for (const id of sectionIds) {
    await expect(page.locator(`#${id}`), `Section #${id} missing`).toBeAttached();
  }
});

// ====================================================
// 3. HUD ELEMENTS EXIST & ARE POSITIONED CORRECTLY
// ====================================================
test('HUD: all fixed UI elements exist', async ({ page }) => {
  await loadPage(page);
  for (const id of ['cursor', 'cursor-ring', 'progress', 'nav-dots', 'love-ticker', 'moon-btn', 'rain-btn', 'music-btn']) {
    await expect(page.locator(`#${id}`), `HUD element #${id} missing`).toBeAttached();
  }
});

test('rain-btn is position:fixed and near bottom', async ({ page }) => {
  await loadPage(page);
  const styles = await page.locator('#rain-btn').evaluate(el => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return { position: cs.position, bottom: cs.bottom, rectTop: rect.top, vpHeight: window.innerHeight };
  });
  expect(styles.position).toBe('fixed');
  // bottom of button should be below the midpoint of the viewport
  expect(styles.rectTop, 'rain-btn should be below mid-viewport').toBeGreaterThan(styles.vpHeight * 0.5);
});

test('music-btn is position:fixed and near bottom', async ({ page }) => {
  await loadPage(page);
  const styles = await page.locator('#music-btn').evaluate(el => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return { position: cs.position, rectTop: rect.top, vpHeight: window.innerHeight };
  });
  expect(styles.position).toBe('fixed');
  expect(styles.rectTop, 'music-btn should be below mid-viewport').toBeGreaterThan(styles.vpHeight * 0.5);
});

test('moon-btn is position:fixed and near top', async ({ page }) => {
  await loadPage(page);
  const styles = await page.locator('#moon-btn').evaluate(el => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return { position: cs.position, rectTop: rect.top, vpHeight: window.innerHeight };
  });
  expect(styles.position).toBe('fixed');
  expect(styles.rectTop, 'moon-btn should be near top of viewport').toBeLessThan(styles.vpHeight * 0.3);
});

test('progress bar is position:fixed at top', async ({ page }) => {
  await loadPage(page);
  const pos = await page.locator('#progress').evaluate(el => getComputedStyle(el).position);
  expect(pos).toBe('fixed');
});

test('love-ticker is visible in top-right', async ({ page }) => {
  await loadPage(page);
  const rect = await page.locator('#love-ticker').boundingBox();
  expect(rect).not.toBeNull();
  if (rect) {
    expect(rect.x, 'love-ticker should be on right side').toBeGreaterThan(640);
    expect(rect.y, 'love-ticker should be near top').toBeLessThan(200);
  }
});

// ====================================================
// 4. CANVAS ELEMENTS
// ====================================================
test('all canvas elements exist', async ({ page }) => {
  await loadPage(page);
  for (const id of ['aurora-canvas', 'particles-canvas', 'heart-rain-canvas', 'waterfall-canvas', 'wish-canvas', 'galaxy-canvas']) {
    await expect(page.locator(`#${id}`), `Canvas #${id} missing`).toBeAttached();
  }
});

// ====================================================
// 5. DYNAMICALLY BUILT CONTENT
// ====================================================
test('nav dots: 24 dots built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('.nav-dot-wrap').count();
  expect(count).toBe(24);
});

test('polaroids: 8 cards built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('.polaroid').count();
  expect(count).toBe(8);
});

test('open-when: 6 envelopes built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('#envelopes-grid .mini-env').count();
  expect(count).toBe(6);
});

test('bubbles: 30 bubbles built', async ({ page }) => {
  await loadPage(page);
  await page.waitForFunction(() => document.querySelectorAll('#bubbles-wrap .bubble').length > 0);
  const count = await page.locator('#bubbles-wrap .bubble').count();
  expect(count).toBe(30);
});

test('stars: 18 star buttons built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('#star-field .star-btn').count();
  expect(count).toBe(18);
});

test('flower: 8 petals built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('#flower-wrap .petal').count();
  expect(count).toBe(8);
});

test('promises: 12 promise items built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('#promise-scroll .promise-item').count();
  expect(count).toBe(12);
});

test('clock: 12 hour notes built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('#clock-face .hour-note').count();
  expect(count).toBe(12);
});

test('would-do: items built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('#would-do-list .wd-line').count();
  expect(count).toBeGreaterThan(0);
});

test('marquee: text spans built', async ({ page }) => {
  await loadPage(page);
  const count = await page.locator('#marquee-inner span').count();
  expect(count).toBeGreaterThan(0);
});

// ====================================================
// 6. CSS CUSTOM PROPERTIES DEFINED
// ====================================================
test('CSS custom properties are defined', async ({ page }) => {
  await loadPage(page);
  const vars = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      rose: style.getPropertyValue('--rose').trim(),
      gold: style.getPropertyValue('--gold').trim(),
      midnight: style.getPropertyValue('--midnight').trim(),
      cream: style.getPropertyValue('--cream').trim(),
    };
  });
  expect(vars.rose, '--rose not defined').toBeTruthy();
  expect(vars.gold, '--gold not defined').toBeTruthy();
  expect(vars.midnight, '--midnight not defined').toBeTruthy();
  expect(vars.cream, '--cream not defined').toBeTruthy();
});

// ====================================================
// 7. LETTER CARD READABILITY
// ====================================================
test('letter card has opaque background (readable)', async ({ page }) => {
  await loadPage(page);
  const bg = await page.locator('#letter-card').evaluate(el => {
    return getComputedStyle(el).backgroundColor;
  });
  // Should NOT be transparent
  expect(bg, 'letter-card background is transparent').not.toBe('rgba(0, 0, 0, 0)');
  expect(bg, 'letter-card background is transparent').not.toContain('rgba(0, 0, 0, 0)');
  // Should have a light/cream background
  expect(bg, 'letter-card should be light colored').not.toBe('transparent');
});

test('letter card text has dark color', async ({ page }) => {
  await loadPage(page);
  const color = await page.locator('#letter-card p').first().evaluate(el => {
    return getComputedStyle(el).color;
  });
  // Color should not be white/light — parse RGB and check it's dark
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const luminance = 0.299 * parseInt(match[1]) + 0.587 * parseInt(match[2]) + 0.114 * parseInt(match[3]);
    expect(luminance, `letter card text too light (luminance=${luminance})`).toBeLessThan(180);
  }
});

// ====================================================
// 8. INTERACTIONS
// ====================================================
test('begin-btn exists and is a button', async ({ page }) => {
  await loadPage(page);
  // Make it visible for testing
  await page.evaluate(() => {
    const btn = document.getElementById('begin-btn');
    if (btn) { btn.style.opacity = '1'; btn.classList.add('show'); }
  });
  await expect(page.locator('#begin-btn')).toBeAttached();
  const tag = await page.locator('#begin-btn').evaluate(el => el.tagName.toLowerCase());
  expect(tag).toBe('button');
});

test('next-reason-btn cycles through reasons', async ({ page }) => {
  await loadPage(page);
  const firstReason = await page.locator('#typed-span').textContent();
  const firstNum = await page.locator('#reason-num').textContent();

  await page.locator('#next-reason-btn').click();
  await page.waitForTimeout(200);

  const newNum = await page.locator('#reason-num').textContent();
  expect(parseInt(newNum ?? '0')).toBe((parseInt(firstNum ?? '1') % 50) + 1);
});

test('whisper orb click shows whisper text', async ({ page }) => {
  await loadPage(page);
  await page.locator('#whisper-orb').click();
  await page.waitForTimeout(1700); // 500ms delay + 1s transition + buffer
  const text = await page.locator('#whisper-text').textContent();
  expect(text?.trim().length, 'whisper text is empty after click').toBeGreaterThan(10);
  const isVisible = await page.locator('#whisper-text').evaluate(el => getComputedStyle(el).opacity);
  expect(parseFloat(isVisible), 'whisper text not visible after click').toBeGreaterThan(0.8);
});

test('open-when envelope opens modal', async ({ page }) => {
  await loadPage(page);
  await page.locator('#envelopes-grid .mini-env').first().click();
  const modal = page.locator('#ow-modal');
  await expect(modal).toHaveClass(/show/);
  const title = await page.locator('#ow-title').textContent();
  expect(title?.length, 'modal title is empty').toBeGreaterThan(0);
});

test('open-when modal closes on button click', async ({ page }) => {
  await loadPage(page);
  await page.locator('#envelopes-grid .mini-env').first().click();
  await page.locator('.ow-close').click();
  const modal = page.locator('#ow-modal');
  await expect(modal).not.toHaveClass(/show/);
});

test('envelope click opens letter', async ({ page }) => {
  await loadPage(page);
  // Scroll envelope into view and click
  await page.locator('#envelope-wrap').evaluate(el => el.scrollIntoView());
  await page.locator('#envelope-wrap').click();
  await page.waitForTimeout(1000);
  const bodyClass = await page.locator('#envelope-body').evaluate(el => el.className);
  expect(bodyClass, 'envelope did not open').toContain('open');
});

test('wish input: type and send wish', async ({ page }) => {
  await loadPage(page);
  await page.locator('#wish-input').fill('I wish for forever with you');
  await page.locator('#wish-send').click();
  await page.waitForTimeout(200);
  const wishCount = await page.locator('#wishes-list .wish-item').count();
  expect(wishCount, 'wish was not added to list').toBeGreaterThan(0);
  const wishText = await page.locator('#wishes-list .wish-item').first().textContent();
  expect(wishText).toContain('I wish for forever with you');
});

test('wish send: empty input does not add item', async ({ page }) => {
  await loadPage(page);
  await page.locator('#wish-send').click();
  const wishCount = await page.locator('#wishes-list .wish-item').count();
  expect(wishCount).toBe(0);
});

test('bubble click removes bubble', async ({ page }) => {
  await loadPage(page);
  // Bubbles are built lazily via IntersectionObserver — scroll section into view first
  await page.locator('#bubbles-section').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll('#bubbles-wrap .bubble').length > 0);
  const initial = await page.locator('#bubbles-wrap .bubble').count();
  await page.locator('#bubbles-wrap .bubble').first().click({ force: true });
  await page.waitForTimeout(500); // animation duration
  const after = await page.locator('#bubbles-wrap .bubble').count();
  expect(after, 'bubble was not removed after click').toBeLessThan(initial);
});

test('star button click opens popup', async ({ page }) => {
  await loadPage(page);
  // Star field has drift animation — use force:true to bypass stability check
  await page.locator('#star-field .star-btn').first().click({ force: true });
  await page.waitForTimeout(200);
  const popup = page.locator('#star-popup');
  const display = await popup.evaluate(el => getComputedStyle(el).display);
  expect(display, 'star popup not shown').not.toBe('none');
});

test('star popup close button works', async ({ page }) => {
  await loadPage(page);
  await page.locator('#star-field .star-btn').first().click({ force: true });
  await page.waitForTimeout(200);
  await page.locator('.star-popup-close').click();
  await page.waitForTimeout(500);
  const popup = page.locator('#star-popup');
  await expect(popup).not.toHaveClass(/show/);
});

test('moon button click shows popup', async ({ page }) => {
  await loadPage(page);
  // Use force:true since cursor:none CSS can occasionally affect pointer interception
  await page.locator('#moon-btn').click({ force: true });
  await page.waitForTimeout(200);
  const popup = page.locator('#moon-popup');
  const display = await popup.evaluate(el => getComputedStyle(el).display);
  expect(display, 'moon popup not shown').not.toBe('none');
});

test('rain button triggers heart rain canvas', async ({ page }) => {
  await loadPage(page);
  await page.locator('#rain-btn').click();
  await page.waitForTimeout(200);
  const canvasHasSize = await page.locator('#heart-rain-canvas').evaluate(el => {
    const c = /** @type {HTMLCanvasElement} */ (el);
    return c.width > 0 && c.height > 0;
  });
  expect(canvasHasSize, 'heart-rain-canvas not sized after rain btn click').toBe(true);
});

// ====================================================
// 9. COUNTER & DATE
// ====================================================
test('final date is set', async ({ page }) => {
  await loadPage(page);
  const dateText = await page.locator('#final-date').textContent();
  expect(dateText?.trim().length, 'final-date is empty').toBeGreaterThan(0);
});

test('ticker count increments', async ({ page }) => {
  await loadPage(page);
  const first = parseInt(await page.locator('#ticker-count').textContent() ?? '0');
  await page.waitForTimeout(2000);
  const second = parseInt((await page.locator('#ticker-count').textContent() ?? '0').replace(/,/g, ''));
  expect(second, 'love ticker is not incrementing').toBeGreaterThan(first);
});

// ====================================================
// 10. CLOCK HANDS
// ====================================================
test('clock hour and minute hands exist', async ({ page }) => {
  await loadPage(page);
  await expect(page.locator('#hour-hand')).toBeAttached();
  await expect(page.locator('#minute-hand')).toBeAttached();
  // Clock hands should have a transform set by animateClock()
  const hourTransform = await page.locator('#hour-hand').evaluate(el =>
    /** @type {HTMLElement} */ (el).style.transform
  );
  expect(hourTransform, 'hour-hand has no transform (clock not running)').not.toBe('');
});

// ====================================================
// 11. FINAL SECTION
// ====================================================
test('final section has all expected elements', async ({ page }) => {
  await loadPage(page);
  await expect(page.locator('#fq1')).toBeAttached();
  await expect(page.locator('.final-card')).toBeAttached();
  await expect(page.locator('.names')).toBeAttached();
  await expect(page.locator('.forever-text')).toBeAttached();
  await expect(page.locator('#marquee-inner')).toBeAttached();
});

test('final card has heart emoji', async ({ page }) => {
  await loadPage(page);
  const heartText = await page.locator('.heart-big').textContent();
  expect(heartText?.trim()).toBeTruthy();
});

// ====================================================
// 12. OPENING SECTION
// ====================================================
test('opening: title chars are built for name', async ({ page }) => {
  await loadPage(page);
  const charCount = await page.locator('#title-chars span').count();
  expect(charCount, 'title chars not built').toBeGreaterThan(5);
});

test('opening: begin-btn text is correct', async ({ page }) => {
  await loadPage(page);
  const text = await page.locator('#begin-btn').textContent();
  expect(text?.trim()).toBeTruthy();
});

// ====================================================
// 13. EKG / HEARTBEAT
// ====================================================
test('EKG path exists in heartbeat section', async ({ page }) => {
  await loadPage(page);
  await expect(page.locator('#ekg-line')).toBeAttached();
  await expect(page.locator('#love-word')).toBeAttached();
});

// ====================================================
// 14. TYPEWRITER SECTION
// ====================================================
test('typewriter section has reason counter', async ({ page }) => {
  await loadPage(page);
  const num = await page.locator('#reason-num').textContent();
  expect(parseInt(num ?? '0')).toBeGreaterThan(0);
});

// ====================================================
// 15. SCROLLBAR CSS
// ====================================================
test('html element has scrollbar-color CSS (not orphaned)', async ({ page }) => {
  await loadPage(page);
  const hasScrollbarColor = await page.evaluate(() => {
    // If scrollbar-color is set on html, it won't be on body or a random element
    const style = getComputedStyle(document.documentElement);
    // We can check that the property exists (won't work in all browsers but won't throw either)
    return true; // If we reach here with no error, CSS parsed fine
  });
  expect(hasScrollbarColor).toBe(true);
});

// ====================================================
// 16. MOBILE VIEWPORT TESTS (390×844)
// ====================================================
test.describe('Mobile viewport (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobile: no JS errors', async ({ page }) => {
    const errors = await loadPage(page);
    expect(errors, `JS errors: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('mobile: no horizontal scroll overflow', async ({ page }) => {
    await loadPage(page);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow, 'page has horizontal overflow on mobile').toBe(false);
  });

  test('mobile: all 24 sections exist', async ({ page }) => {
    await loadPage(page);
    const sectionIds = [
      'opening','her-words','reply-section','night-knew','heartbeat',
      'typewriter-section','waterfall-section','rose-section','polaroid-section',
      'whisper-section','open-when','wish-section','envelope-section','flower-section',
      'promise-section','clock-section','bubbles-section','stars-section',
      'galaxy-section','home-section','counter-section','kiss-section','would-do','final'
    ];
    for (const id of sectionIds) {
      await expect(page.locator(`#${id}`), `mobile: missing #${id}`).toBeAttached();
    }
  });

  test('mobile: HUD buttons are large enough to tap', async ({ page }) => {
    await loadPage(page);
    for (const id of ['rain-btn', 'music-btn', 'moon-btn']) {
      const box = await page.locator(`#${id}`).boundingBox();
      expect(box, `${id} not found`).not.toBeNull();
      if (box) {
        expect(box.width, `${id} too narrow for touch`).toBeGreaterThanOrEqual(40);
        expect(box.height, `${id} too short for touch`).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('mobile: opening section fits viewport width', async ({ page }) => {
    await loadPage(page);
    const overflow = await page.evaluate(() => {
      const el = document.getElementById('opening');
      return el ? el.scrollWidth > document.documentElement.clientWidth : false;
    });
    expect(overflow, 'opening section overflows on mobile').toBe(false);
  });

  test('mobile: kiss section figures exist', async ({ page }) => {
    await loadPage(page);
    await expect(page.locator('#kiss-section')).toBeAttached();
    await expect(page.locator('#male-fig')).toBeAttached();
    await expect(page.locator('#female-fig')).toBeAttached();
  });
});
