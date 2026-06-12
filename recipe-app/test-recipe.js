const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  
  // Set Hebrew text support
  await page.addInitScript(() => {
    document.documentElement.lang = 'he';
  });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Wait for recipes to load
  await page.waitForSelector('[data-recipe-id]', { timeout: 5000 });
  
  // Take screenshot
  await page.screenshot({ path: 'C:\\Users\\guy\\Desktop\\cooking book\\home-page.png', fullPage: true });
  
  // Check if recipe 21 exists in the page
  const recipes = await page.locator('[data-recipe-id]').all();
  const recipe21 = await page.locator('[data-recipe-id="21"]').isVisible();
  
  console.log(`Found ${recipes.length} recipes on page`);
  console.log(`Recipe 21 visible: ${recipe21}`);
  
  // Get the recipe card text if visible
  if (recipe21) {
    const recipeText = await page.locator('[data-recipe-id="21"]').textContent();
    console.log(`Recipe text: ${recipeText.substring(0, 100)}`);
  }
  
  await browser.close();
})();
