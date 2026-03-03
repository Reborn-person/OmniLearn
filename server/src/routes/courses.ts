import { Router } from 'express';
import { getAllCourses, getCourseById, createCourse } from '../db/index.js';

export const courseRouter = Router();

// Get all courses
courseRouter.get('/', (req, res) => {
  try {
    const courses = getAllCourses();
    res.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course
courseRouter.get('/:id', (req, res) => {
  try {
    const course = getCourseById(parseInt(req.params.id));
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course
courseRouter.post('/', (req, res) => {
  try {
    const { title, description, category } = req.body;
    const creatorId = 1; // TODO: Get from auth
    
    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const courseId = createCourse(title, description || '', category || 'general', creatorId);
    const course = getCourseById(Number(courseId));
    
    res.status(201).json({ course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});
