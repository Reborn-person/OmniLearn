import { Router } from 'express';
import { getLessonsByCourse, getLessonById, createLesson } from '../db/index.js';

export const lessonRouter = Router();

// Get lessons by course
lessonRouter.get('/course/:courseId', (req, res) => {
  try {
    const lessons = getLessonsByCourse(parseInt(req.params.courseId));
    res.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get single lesson
lessonRouter.get('/:id', (req, res) => {
  try {
    const lesson = getLessonById(parseInt(req.params.id));
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json({ lesson: { ...lesson, content: JSON.parse(lesson.content) } });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Create lesson
lessonRouter.post('/', (req, res) => {
  try {
    const { courseId, title, description, lessonType, content, orderIndex } = req.body;
    
    if (!courseId || !title || !lessonType || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const lessonId = createLesson(
      courseId, 
      title, 
      description || '', 
      lessonType, 
      contentStr, 
      orderIndex || 0
    );
    
    const lesson = getLessonById(Number(lessonId));
    res.status(201).json({ lesson });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});
