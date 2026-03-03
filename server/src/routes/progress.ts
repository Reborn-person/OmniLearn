import { Router } from 'express';
import { getUserProgress, updateUserProgress, getUserCourseProgress } from '../db/index.js';

export const progressRouter = Router();

// Get lesson progress
progressRouter.get('/lesson/:lessonId', (req, res) => {
  try {
    const userId = parseInt(req.headers['x-user-id'] as string) || 1;
    const progress = getUserProgress(userId, parseInt(req.params.lessonId));
    res.json({ progress: progress || { completed: false, score: 0 } });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update lesson progress
progressRouter.post('/lesson/:lessonId', (req, res) => {
  try {
    const userId = parseInt(req.headers['x-user-id'] as string) || 1;
    const { completed, score } = req.body;
    
    updateUserProgress(userId, parseInt(req.params.lessonId), completed, score);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get course progress
progressRouter.get('/course/:courseId', (req, res) => {
  try {
    const userId = parseInt(req.headers['x-user-id'] as string) || 1;
    const progress = getUserCourseProgress(userId, parseInt(req.params.courseId));
    res.json({ progress });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ error: 'Failed to fetch course progress' });
  }
});
