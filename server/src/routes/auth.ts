import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserById, createUser } from '../db/index.js';

export const authRouter = Router();

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({ 
      user: userWithoutPassword,
      token: `demo-token-${user.id}` // Simple token for demo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = createUser(email, passwordHash, name);
    
    const user = getUserById(Number(userId));
    
    res.status( 
      user,
201).json({      token: `demo-token-${userId}`
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('demo-token-')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = parseInt(authHeader.replace('demo-token-', ''));
  const user = getUserById(userId);
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  res.json({ user });
});
