import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { join } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// MongoDB Schemas
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

// Connect to MongoDB
mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

console.log('🔍 Server path info:');
console.log('__dirname:', __dirname);
console.log('MONGODB_URI:', MONGODB_URI ? '✅ Set' : '❌ Missing');

app.use(cors());
app.use(express.json({ limit: '50mb', charset: 'utf8' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, charset: 'utf8' }));

// Serve static files from dist/ for production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Ensure UTF-8 responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
};

const requireAuth = (req, res) => {
  const user = verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
};

const fetchRecipeImage = async (recipeName) => {
  try {
    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('⚠️ UNSPLASH_ACCESS_KEY not set, skipping image fetch');
      return null;
    }

    let searchQuery = recipeName;

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
        console.log(`🔄 Translated "${recipeName}" → "${searchQuery}"`);
      } catch (err) {
        console.warn(`Could not translate recipe name, using Hebrew: ${err.message}`);
      }
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn(`No image found for: "${recipeName}" (searched: "${searchQuery}")`);
      return null;
    }

    const imageUrl = data.results[0].urls.regular;
    console.log(`📷 Fetching image for "${recipeName}" from Unsplash...`);

    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error(`Error fetching image for "${recipeName}":`, err.message);
    return null;
  }
};

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'הסיסמאות אינן תואמות' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'הסיסמה חייבת להיות לפחות 6 תווים' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: existingUser.username === username ? 'שם משתמש זה כבר קיים' : 'אימייל זה כבר רשום' });
    }

    const lastUser = await User.findOne().sort({ id: -1 });
    const newId = lastUser ? lastUser.id + 1 : 1;

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new User({
      id: newId,
      username,
      email,
      passwordHash: hashedPassword,
      role: 'user',
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(user);
});

// Admin endpoints
app.get('/api/admin/users', async (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const users = await User.find({}, '-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'שם משתמש או אימייל קיימים' });
    }

    const lastUser = await User.findOne().sort({ id: -1 });
    const newId = lastUser ? lastUser.id + 1 : 1;

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new User({
      id: newId,
      username,
      email,
      passwordHash: hashedPassword,
      role: 'user',
    });

    await newUser.save();

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    });
  } catch (err) {
    console.error('Add user error:', err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = parseInt(req.params.id);
    const { username, email, password, role } = req.body;

    const targetUser = await User.findOne({ id: userId });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) {
      const existingUser = await User.findOne({ username, id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'שם משתמש זה כבר קיים' });
      }
      targetUser.username = username;
    }

    if (email) {
      const existingUser = await User.findOne({ email, id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'אימייל זה כבר בשימוש' });
      }
      targetUser.email = email;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      targetUser.passwordHash = await bcryptjs.hash(password, 10);
    }

    if (role && ['user', 'admin'].includes(role)) {
      targetUser.role = role;
    }

    await targetUser.save();

    res.json({
      id: targetUser.id,
      username: targetUser.username,
      email: targetUser.email,
      role: targetUser.role,
      createdAt: targetUser.createdAt,
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = parseInt(req.params.id);
    const result = await User.deleteOne({ id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Recipe endpoints
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find({});
    res.json(recipes);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.post('/api/recipes', async (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const lastRecipe = await Recipe.findOne().sort({ id: -1 });
    const newId = lastRecipe ? lastRecipe.id + 1 : 1;

    const newRecipe = new Recipe({
      id: newId,
      ...req.body,
      authorId: user.id,
      author: user.username,
      createdAt: new Date(),
    });

    if (!newRecipe.image) {
      const image = await fetchRecipeImage(newRecipe.name);
      if (image) {
        newRecipe.image = image;
      }
    }

    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (err) {
    console.error('Error adding recipe:', err);
    res.status(500).json({ error: 'Failed to add recipe' });
  }
});

app.put('/api/recipes/:id', async (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const id = parseInt(req.params.id);
    const recipe = await Recipe.findOne({ id });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (recipe.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedData = { ...req.body, id, authorId: recipe.authorId };

    if (user.role !== 'admin') {
      updatedData.author = recipe.author;
    } else if (req.body.author && req.body.author !== recipe.author) {
      const newAuthor = await User.findOne({ username: req.body.author });
      if (newAuthor) {
        updatedData.authorId = newAuthor.id;
      }
    }

    if (!updatedData.image) {
      const image = await fetchRecipeImage(updatedData.name);
      if (image) {
        updatedData.image = image;
      }
    }

    Object.assign(recipe, updatedData);
    await recipe.save();
    res.json(recipe);
  } catch (err) {
    console.error('Error updating recipe:', err);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const id = parseInt(req.params.id);
    const recipe = await Recipe.findOne({ id });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (recipe.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Recipe.deleteOne({ id });
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Reviews endpoints
app.post('/api/recipes/:id/reviews', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const recipe = await Recipe.findOne({ id });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const { author, rating, text } = req.body;

    if (!author || !rating || !text) {
      return res.status(400).json({ error: 'Missing required fields: author, rating, text' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const newReview = {
      id: `r${Date.now()}`,
      author,
      rating: parseInt(rating),
      text,
      createdAt: new Date().toISOString(),
    };

    recipe.reviews.push(newReview);
    recipe.averageRating = calculateAverageRating(recipe.reviews);

    await recipe.save();
    res.status(201).json(newReview);
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

app.delete('/api/recipes/:id/reviews/:reviewId', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const reviewId = req.params.reviewId;
    const recipe = await Recipe.findOne({ id });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const reviewIndex = recipe.reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex === -1) {
      return res.status(404).json({ error: 'Review not found' });
    }

    recipe.reviews.splice(reviewIndex, 1);
    recipe.averageRating = calculateAverageRating(recipe.reviews);

    await recipe.save();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// AI endpoints
app.post('/api/ai/search', async (req, res) => {
  try {
    const { query, recipes } = req.body;

    if (!query || !recipes || !Array.isArray(recipes)) {
      return res.status(400).json({ error: 'Missing query or recipes array' });
    }

    const recipesList = recipes
      .map(r => `ID: ${r.id}, שם: ${r.name}, תיאור: ${r.description}, קושי: ${r.difficulty}, מטבח: ${r.cuisine}, סוג: ${r.dietType}, זמן: ${r.prepTime}`)
      .join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: 'אתה מנוע חיפוש מתכונים. קבל שאילתה בעברית ורשימת מתכונים, החזר JSON בלבד: {"ids": [ID1, ID2, ...]} מסודר לפי רלוונטיות (הכי רלוונטי ראשון).',
      messages: [
        {
          role: 'user',
          content: `שאילתה: ${query}\n\nמתכונים:\n${recipesList}`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { ids: [] };

    res.json({ ids: result.ids || [] });
  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ error: 'Failed to search' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = [], recipe } = req.body;

    if (!message || !recipe) {
      return res.status(400).json({ error: 'Missing message or recipe' });
    }

    const recipeContext = `מתכון: ${recipe.name}\nמצרכים: ${recipe.ingredients?.map(i => `${i.amount} ${i.unit} ${i.name}`).join(', ')}\nהוראות: ${recipe.instructions?.join(', ')}`;

    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `אתה עוזר בישול ידידותי. ענה בעברית בקצרה (עד שורה אחת-שתיים). הקשר: ${recipeContext}`,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to chat' });
  }
});

// SPA fallback: serve index.html for client-side routing
app.get('*', (req, res) => {
  const distPath = join(__dirname, '..', 'dist');
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍽️ Recipe server running on http://localhost:${PORT}`);
});
