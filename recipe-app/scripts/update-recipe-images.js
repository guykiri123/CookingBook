import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_FILE = path.join(__dirname, '..', 'data', 'recipes.json');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const fetchRecipeImage = async (recipeName) => {
  try {
    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('⚠️ UNSPLASH_ACCESS_KEY not set, skipping image fetch');
      return null;
    }

    let searchQuery = recipeName;

    // If recipe name is in Hebrew, translate to English first for better Unsplash results
    if (/[֐-׿]/.test(recipeName)) {
      try {
        const translation = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 50,
          messages: [
            {
              role: 'user',
              content: `תרגם את שם המנה הזה לאנגלית בקצרה (רק את השם, בלי הסברים): "${recipeName}"`,
            },
          ],
        });
        const translatedName = translation.content[0].type === 'text' ? translation.content[0].text.trim() : recipeName;
        searchQuery = translatedName;
        console.log(`  🔄 Translated "${recipeName}" → "${searchQuery}"`);
      } catch (err) {
        console.warn(`  ⚠️ Could not translate recipe name, using Hebrew: ${err.message}`);
      }
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`;

    console.log(`  🔍 Searching Unsplash for: "${searchQuery}"`);
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn(`  ❌ No image found for: "${recipeName}" (searched: "${searchQuery}")`);
      return null;
    }

    const imageUrl = data.results[0].urls.regular;
    console.log(`  📥 Downloading image from Unsplash...`);

    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log(`  ✅ Image fetched successfully (${Math.round(buffer.length / 1024)}KB)`);
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error(`  ❌ Error fetching image:`, err.message);
    return null;
  }
};

const main = async () => {
  try {
    console.log('📖 Loading recipes from', RECIPES_FILE);
    const data = fs.readFileSync(RECIPES_FILE, 'utf8');
    const recipes = JSON.parse(data);

    const recipesWithoutImage = recipes.filter(r => !r.image);
    console.log(`\n🎯 Found ${recipes.length} total recipes, ${recipesWithoutImage.length} need images\n`);

    if (recipesWithoutImage.length === 0) {
      console.log('✅ All recipes already have images!');
      return;
    }

    for (let i = 0; i < recipesWithoutImage.length; i++) {
      const recipe = recipesWithoutImage[i];
      console.log(`[${i + 1}/${recipesWithoutImage.length}] Processing: "${recipe.name}"`);

      const image = await fetchRecipeImage(recipe.name);
      if (image) {
        const recipeIndex = recipes.findIndex(r => r.id === recipe.id);
        recipes[recipeIndex].image = image;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n💾 Saving updated recipes...');
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
    console.log('✅ Done! All recipes updated with images.');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

main();
