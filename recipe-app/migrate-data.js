import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define schemas (copy from server)
const userSchema = new mongoose.Schema({
  id: Number,
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const reviewSchema = new mongoose.Schema({
  id: String,
  author: String,
  rating: Number,
  text: String,
  createdAt: Date
});

const recipeSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  difficulty: String,
  cuisine: String,
  dietType: String,
  prepTime: String,
  servings: Number,
  cookTime: Number,
  tips: String,
  image: String,
  author: String,
  authorId: Number,
  createdAt: Date,
  averageRating: { type: Number, default: 0 },
  ingredients: [{
    name: String,
    amount: Number,
    unit: String
  }],
  instructions: [String],
  reviews: [reviewSchema]
});

const User = mongoose.model('User', userSchema);
const Recipe = mongoose.model('Recipe', recipeSchema);

async function migrate() {
  try {
    console.log('🚀 Starting data migration to MongoDB...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Read JSON files
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/users.json'), 'utf8'));
    const recipesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/recipes.json'), 'utf8'));

    // Clear existing data
    await User.deleteMany({});
    await Recipe.deleteMany({});
    console.log('🗑️ Cleared existing data\n');

    // Migrate users
    console.log('📤 Uploading users...');
    for (const user of usersData) {
      await User.create(user);
      console.log(`  ✅ ${user.username}`);
    }

    console.log('\n📤 Uploading recipes...');

    // Migrate recipes
    for (const recipe of recipesData) {
      await Recipe.create(recipe);
      console.log(`  ✅ ${recipe.name} (${recipe.ingredients?.length || 0} ingredients, ${recipe.reviews?.length || 0} reviews)`);
    }

    console.log('\n✨ Migration complete!');
    console.log(`   Users: ${usersData.length}`);
    console.log(`   Recipes: ${recipesData.length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
