import { Router } from 'express';
import { getLessonsByCourse, getLessonById, createLesson, updateLesson, createLessonVersion, getLessonVersions, createCourse } from '../db/index.js';
import { validateRuntimeSchema } from '../lib/runtimeSchema.js';

export const lessonRouter = Router();

// Publish runtime lesson from schema (minimal engine path)
lessonRouter.post('/runtime/publish', (req, res) => {
  try {
    const {
      courseTitle,
      courseDescription,
      category,
      lessonTitle,
      lessonDescription,
      schema,
      lessonId,
      courseId,
      changeNote,
      creatorId = 1,
    } = req.body;

    if (!schema) {
      return res.status(400).json({ error: 'schema is required' });
    }

    const validation = validateRuntimeSchema(schema);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || 'Invalid runtime schema' });
    }

    const contentStr = JSON.stringify(schema);
    const isRepublish = lessonId !== undefined && lessonId !== null;

    if (isRepublish) {
      const existing = getLessonById(Number(lessonId));
      if (!existing) {
        return res.status(404).json({ error: 'Lesson not found for republish' });
      }

      updateLesson(
        Number(lessonId),
        lessonTitle || String(existing.title || 'Runtime Lesson'),
        lessonDescription || String(existing.description || ''),
        'runtime',
        contentStr,
        Number(existing.order_index || 0)
      );

      const version = createLessonVersion(
        Number(lessonId),
        contentStr,
        changeNote || 'runtime republish',
        Number(creatorId)
      );
      const updatedLesson = getLessonById(Number(lessonId));
      return res.status(200).json({
        lesson: updatedLesson,
        courseId: Number(existing.course_id),
        version,
        mode: 'republish'
      });
    }

    if (!courseTitle || !lessonTitle) {
      return res.status(400).json({ error: 'courseTitle and lessonTitle are required for initial publish' });
    }

    const targetCourseId = courseId
      ? Number(courseId)
      : Number(createCourse(courseTitle, courseDescription || '', category || 'runtime', Number(creatorId)));

    const createdLessonId = createLesson(
      targetCourseId,
      lessonTitle,
      lessonDescription || '',
      'runtime',
      contentStr,
      0
    );

    const version = createLessonVersion(
      Number(createdLessonId),
      contentStr,
      changeNote || 'initial runtime publish',
      Number(creatorId)
    );

    const lesson = getLessonById(Number(createdLessonId));
    res.status(201).json({ lesson, courseId: targetCourseId, version, mode: 'create' });
  } catch (error) {
    console.error('Error publishing runtime lesson:', error);
    res.status(500).json({ error: 'Failed to publish runtime lesson' });
  }
});

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

// Get lesson versions
lessonRouter.get('/:id/versions', (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const versions = getLessonVersions(lessonId).map((v) => {
      try {
        return { ...v, content: JSON.parse(String(v.content)) };
      } catch {
        return v;
      }
    });
    res.json({ versions });
  } catch (error) {
    console.error('Error fetching lesson versions:', error);
    res.status(500).json({ error: 'Failed to fetch lesson versions' });
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

    if (lessonType === 'runtime') {
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      const validation = validateRuntimeSchema(parsedContent);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error || 'Invalid runtime schema' });
      }
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
    
    createLessonVersion(Number(lessonId), contentStr, 'initial create');

    const lesson = getLessonById(Number(lessonId));
    res.status(201).json({ lesson });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update lesson content and create a new version
lessonRouter.put('/:id', (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const existing = getLessonById(lessonId);

    if (!existing) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const {
      title = existing.title,
      description = existing.description,
      lessonType = existing.lesson_type,
      content = existing.content,
      orderIndex = existing.order_index || 0,
      changeNote = 'content update',
      creatorId = 1,
    } = req.body;

    if (lessonType === 'runtime') {
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      const validation = validateRuntimeSchema(parsedContent);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error || 'Invalid runtime schema' });
      }
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    updateLesson(lessonId, title, description, lessonType, contentStr, orderIndex);
    const version = createLessonVersion(lessonId, contentStr, changeNote, Number(creatorId));

    const lesson = getLessonById(lessonId);
    res.json({ lesson, version });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});
