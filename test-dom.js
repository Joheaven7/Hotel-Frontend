const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3001/gallery', { waitUntil: 'networkidle2' });
    
    // Wait for the masonry grid to be rendered
    await page.waitForSelector('.masonry-grid', { timeout: 5000 }).catch(() => console.log('.masonry-grid not found'));
    
    // Check if the masonry grid exists and its dimensions
    const gridInfo = await page.evaluate(() => {
      const grid = document.querySelector('.masonry-grid');
      if (!grid) return null;
      
      const items = document.querySelectorAll('.masonry-item');
      const firstItem = items[0];
      
      return {
        gridRect: grid.getBoundingClientRect().toJSON(),
        itemsCount: items.length,
        firstItemHtml: firstItem ? firstItem.innerHTML : null,
        firstItemRect: firstItem ? firstItem.getBoundingClientRect().toJSON() : null,
        firstItemClasses: firstItem ? firstItem.className : null,
      };
    });
    
    console.log("Grid Info:", JSON.stringify(gridInfo, null, 2));
    await browser.close();
  } catch (err) {
    console.error("Puppeteer Error:", err);
  }
})();
