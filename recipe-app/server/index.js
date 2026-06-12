import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const app = express();
const PORT = 3001;
const RECIPES_FILE = join(__dirname, '..', 'data', 'recipes.json');
const USERS_FILE = join(__dirname, '..', 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log('🔍 Server path info:');
console.log('__dirname:', __dirname);
console.log('RECIPES_FILE:', RECIPES_FILE);

app.use(cors());
app.use(express.json({ limit: '50mb', charset: 'utf8' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, charset: 'utf8' }));

// Ensure UTF-8 responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

const readRecipes = () => {
  try {
    const data = readFileSync(RECIPES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading recipes:', err);
    return [];
  }
};

const writeRecipes = (recipes) => {
  try {
    writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing recipes:', err);
    throw err;
  }
};

const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

const readUsers = () => {
  try {
    const data = readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users:', err);
    return [];
  }
};

const writeUsers = (users) => {
  try {
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users:', err);
    throw err;
  }
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

    const users = readUsers();
    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'שם משתמש זה כבר קיים' });
    }
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: 'אימייל זה כבר רשום' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      role: 'user',
    };

    users.push(newUser);
    writeUsers(users);

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

    const users = readUsers();
    const user = users.find(u => u.email === email);

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

app.get('/api/admin/users', (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const users = readUsers();
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    })));
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

    const users = readUsers();
    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'שם משתמש זה כבר קיים' });
    }
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: 'אימייל זה כבר קיים' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      role: 'user',
    };

    users.push(newUser);
    writeUsers(users);

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

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) {
      if (users.some(u => u.id !== userId && u.username === username)) {
        return res.status(400).json({ error: 'שם משתמש זה כבר קיים' });
      }
      users[userIndex].username = username;
    }
    if (email) {
      if (users.some(u => u.id !== userId && u.email === email)) {
        return res.status(400).json({ error: 'אימייל זה כבר בשימוש' });
      }
      users[userIndex].email = email;
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      users[userIndex].passwordHash = await bcryptjs.hash(password, 10);
    }
    if (role && ['user', 'admin'].includes(role)) {
      users[userIndex].role = role;
    }

    writeUsers(users);

    res.json({
      id: users[userIndex].id,
      username: users[userIndex].username,
      email: users[userIndex].email,
      role: users[userIndex].role,
      createdAt: users[userIndex].createdAt,
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = parseInt(req.params.id);
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.splice(userIndex, 1);
    writeUsers(users);

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/recipes', (req, res) => {
  const recipes = readRecipes();
  res.json(recipes);
});

app.post('/api/recipes', (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const recipes = readRecipes();
    const newRecipe = {
      id: recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1,
      ...req.body,
      authorId: user.id,
      createdAt: new Date().toISOString(),
    };
    recipes.push(newRecipe);
    writeRecipes(recipes);
    res.status(201).json(newRecipe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add recipe' });
  }
});

app.put('/api/recipes/:id', (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const recipes = readRecipes();
    const id = parseInt(req.params.id);
    const index = recipes.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = recipes[index];
    if (recipe.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    recipes[index] = { ...recipes[index], ...req.body, id, authorId: recipe.authorId, author: recipe.author };
    writeRecipes(recipes);
    res.json(recipes[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

app.delete('/api/recipes/:id', (req, res) => {
  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const recipes = readRecipes();
    const id = parseInt(req.params.id);
    const index = recipes.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = recipes[index];
    if (recipe.authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    recipes.splice(index, 1);
    writeRecipes(recipes);
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

app.post('/api/recipes/:id/reviews', (req, res) => {
  try {
    const recipes = readRecipes();
    const id = parseInt(req.params.id);
    const recipe = recipes.find(r => r.id === id);

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

    if (!recipe.reviews) {
      recipe.reviews = [];
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

    writeRecipes(recipes);
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review' });
  }
});

app.delete('/api/recipes/:id/reviews/:reviewId', (req, res) => {
  try {
    const recipes = readRecipes();
    const id = parseInt(req.params.id);
    const reviewId = req.params.reviewId;
    const recipe = recipes.find(r => r.id === id);

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (!recipe.reviews) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const reviewIndex = recipe.reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex === -1) {
      return res.status(404).json({ error: 'Review not found' });
    }

    recipe.reviews.splice(reviewIndex, 1);
    recipe.averageRating = calculateAverageRating(recipe.reviews);

    writeRecipes(recipes);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

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

app.listen(PORT, () => {
  console.log(`🍽️ Recipe server running on http://localhost:${PORT}`);
});
