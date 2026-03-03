import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/index.js';
import { authRouter } from './routes/auth.js';
import { courseRouter } from './routes/courses.js';
import { lessonRouter } from './routes/lessons.js';
import { aiRouter } from './routes/ai.js';
import { progressRouter } from './routes/progress.js';
import draftsRouter from './routes/drafts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/ai', aiRouter);
app.use('/api/progress', progressRouter);
app.use('/api/drafts', draftsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();