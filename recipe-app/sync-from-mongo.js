import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define schemas (same as server)
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

async function syncFromMongo() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    // Fetch data from MongoDB
    const users = await User.find({}).lean();
    const recipes = await Recipe.find({}).lean();

    // Save to JSON files
    const usersPath = path.join(__dirname, 'data/users.json');
    const recipesPath = path.join(__dirname, 'data/recipes.json');

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
    fs.writeFileSync(recipesPath, JSON.stringify(recipes, null, 2), 'utf8');

    const timestamp = new Date().toLocaleTimeString('he-IL');
    console.log(`✅ ${timestamp} - Synced ${users.length} users, ${recipes.length} recipes`);

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  }
}

const watchMode = process.argv.includes('--watch');

if (watchMode) {
  console.log('👀 Watching MongoDB for changes (30s interval)...\n');
  syncFromMongo();
  setInterval(syncFromMongo, 30000);
} else {
  syncFromMongo().then(() => process.exit(0)).catch(() => process.exit(1));
}
