const { test, expect } = require('@playwright/test');

test.describe('HeyBurrito UI Layout Tests', () => {
  test('Filter section layout validation', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3333');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot of the entire page first
    await page.screenshot({ path: 'tests/playwright/screenshots/full-page.png', fullPage: true });
    
    // Wait for filter section to be visible
    await page.waitForSelector('#filter', { state: 'visible' });
    
    // Take a screenshot of just the filter section
    const filterSection = page.locator('#filter');
    await expect(filterSection).toBeVisible();
    await filterSection.screenshot({ path: 'tests/playwright/screenshots/filter-section.png' });
    
    // Check that toggle switches are visible
    const toFromSwitch = page.locator('#switchToFrom');
    const typeSwitch = page.locator('#switchType');
    const userTypesSwitch = page.locator('#switchUserTypes');
    
    await expect(toFromSwitch).toBeVisible();
    await expect(typeSwitch).toBeVisible();
    await expect(userTypesSwitch).toBeVisible();
    
    // Check that dropdowns are visible
    const periodSelect = page.locator('#periodSelect');
    const limitSelect = page.locator('#limitSelect');
    
    await expect(periodSelect).toBeVisible();
    await expect(limitSelect).toBeVisible();
    
    // Get the bounding boxes to analyze layout
    const headerBox = await page.locator('#header').boundingBox();
    const filterBox = await page.locator('#filter').boundingBox();
    const toFromBox = await toFromSwitch.boundingBox();
    const typeBox = await typeSwitch.boundingBox();
    const userTypesBox = await userTypesSwitch.boundingBox();
    const periodBox = await periodSelect.boundingBox();
    const limitBox = await limitSelect.boundingBox();
    
    console.log('Layout measurements:');
    console.log('Header:', headerBox);
    console.log('Filter section:', filterBox);
    console.log('To/From switch:', toFromBox);
    console.log('Type switch:', typeBox);
    console.log('User Types switch:', userTypesBox);
    console.log('Period dropdown:', periodBox);
    console.log('Limit dropdown:', limitBox);
    
    // Check if dropdowns are inline with toggles by comparing Y positions
    const toggleY = toFromBox.y;
    const periodY = periodBox.y;
    const limitY = limitBox.y;
    
    // Allow some tolerance for alignment (±10px)
    const tolerance = 10;
    const periodsInline = Math.abs(periodY - toggleY) <= tolerance;
    const limitsInline = Math.abs(limitY - toggleY) <= tolerance;
    
    console.log('Toggle Y position:', toggleY);
    console.log('Period dropdown Y position:', periodY);
    console.log('Limit dropdown Y position:', limitY);
    console.log('Period dropdown inline with toggles:', periodsInline);
    console.log('Limit dropdown inline with toggles:', limitsInline);
    
    // Log the current layout state
    if (!periodsInline || !limitsInline) {
      console.log('❌ LAYOUT ISSUE DETECTED: Dropdowns are not inline with toggle controls');
      console.log(`   Period dropdown is ${Math.abs(periodY - toggleY)}px ${periodY > toggleY ? 'below' : 'above'} toggles`);
      console.log(`   Limit dropdown is ${Math.abs(limitY - toggleY)}px ${limitY > toggleY ? 'below' : 'above'} toggles`);
    } else {
      console.log('✅ Layout appears correct: Dropdowns are inline with toggle controls');
    }
    
    // Check the computed styles of filter paragraphs
    const filterParagraphs = page.locator('#filter p');
    const count = await filterParagraphs.count();
    
    console.log('Number of filter paragraphs:', count);
    
    for (let i = 0; i < count; i++) {
      const p = filterParagraphs.nth(i);
      const styles = await p.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          float: computed.float,
          width: computed.width,
          height: computed.height,
          margin: computed.margin,
          padding: computed.padding
        };
      });
      console.log(`Paragraph ${i + 1} styles:`, styles);
    }
    
    // Take a final screenshot highlighting the filter controls
    await page.evaluate(() => {
      // Add visual highlighting to help see the layout
      const filter = document.querySelector('#filter');
      if (filter) {
        filter.style.border = '2px solid red';
        filter.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      }
      
      const paragraphs = document.querySelectorAll('#filter p');
      paragraphs.forEach((p, index) => {
        p.style.border = '1px solid blue';
        p.style.backgroundColor = `rgba(0, 0, 255, 0.${index + 1})`;
      });
    });
    
    await page.screenshot({ path: 'tests/playwright/screenshots/filter-highlighted.png' });
  });
  
  test('Responsive layout on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:3333');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/playwright/screenshots/desktop-view.png' });
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/playwright/screenshots/tablet-view.png' });
    
    // Test mobile view (should trigger the mobile layout)
    await page.setViewportSize({ width: 600, height: 800 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/playwright/screenshots/mobile-view.png' });
    
    // Check filter layout on mobile
    const filterBox = await page.locator('#filter').boundingBox();
    const headerBox = await page.locator('#header').boundingBox();
    
    console.log('Mobile layout - Header:', headerBox);
    console.log('Mobile layout - Filter:', filterBox);
  });
});