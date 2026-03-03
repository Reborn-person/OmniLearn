import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/omnilearn.db');

let db: SqlJsDatabase;

// Initialize database
export async function initDb() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize tables
  db.run(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    -- Courses table
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      category TEXT,
      creator_id INTEGER,
      is_ai_generated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  db.run(`
    -- Lessons table
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      lesson_type TEXT NOT NULL,
      content TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  db.run(`
    -- User progress table
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      last_position INTEGER DEFAULT 0,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      UNIQUE(user_id, lesson_id)
    )
  `);

  db.run(`
    -- Builder drafts table
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  db.run(`
    -- Lesson content versions
    CREATE TABLE IF NOT EXISTS lesson_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      change_note TEXT DEFAULT '',
      created_by INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      UNIQUE(lesson_id, version)
    )
  `);

  saveDb();
  console.log('✅ Database initialized');
  return db;
}

export function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function getDb() {
  return db;
}

// Helper functions
export function getUserByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  stmt.bind([email]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function getUserById(id: number) {
  const stmt = db.prepare('SELECT id, email, name, level, exp, created_at FROM users WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function createUser(email: string, passwordHash: string, name: string) {
  db.run('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)', [email, passwordHash, name]);
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveDb();
  return result[0]?.values[0]?.[0];
}

export function getAllCourses() {
  const courses = db.exec(`
    SELECT c.*, u.name as creator_name, 
           (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
    FROM courses c
    LEFT JOIN users u ON c.creator_id = u.id
    ORDER BY c.created_at DESC
  `);
  
  if (!courses.length) return [];
  
  return courses[0].values.map(row => ({
    id: row[0],
    title: row[1],
    description: row[2],
    cover_image: row[3],
    category: row[4],
    creator_id: row[5],
    is_ai_generated: row[6],
    created_at: row[7],
    updated_at: row[8],
    creator_name: row[9],
    lesson_count: row[10]
  }));
}

export function getCourseById(id: number) {
  const stmt = db.prepare(`
    SELECT c.*, u.name as creator_name
    FROM courses c
    LEFT JOIN users u ON c.creator_id = u.id
    WHERE c.id = ?
  `);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function getLessonsByCourse(courseId: number) {
  const lessons = db.exec(`SELECT id, course_id, title, description, lesson_type, content, order_index, created_at FROM lessons WHERE course_id = ${courseId} ORDER BY order_index`);
  
  if (!lessons.length) return [];
  
  return lessons[0].values.map(row => ({
    id: row[0],
    course_id: row[1],
    title: row[2],
    description: row[3],
    lesson_type: row[4],
    content: row[5],
    order_index: row[6],
    created_at: row[7]
  }));
}

export function getLessonById(id: number) {
  const stmt = db.prepare('SELECT * FROM lessons WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function createCourse(title: string, description: string, category: string, creatorId: number) {
  db.run('INSERT INTO courses (title, description, category, creator_id) VALUES (?, ?, ?, ?)', 
    [title, description, category, creatorId]);
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveDb();
  return result[0]?.values[0]?.[0];
}

export function createLesson(courseId: number, title: string, description: string, lessonType: string, content: string, orderIndex: number) {
  db.run(
    'INSERT INTO lessons (course_id, title, description, lesson_type, content, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [courseId, title, description, lessonType, content, orderIndex]
  );
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveDb();
  return result[0]?.values[0]?.[0];
}

export function updateLesson(id: number, title: string, description: string, lessonType: string, content: string, orderIndex: number) {
  db.run(
    `
      UPDATE lessons
      SET title = ?, description = ?, lesson_type = ?, content = ?, order_index = ?
      WHERE id = ?
    `,
    [title, description, lessonType, content, orderIndex, id]
  );
  saveDb();
}

export function createLessonVersion(lessonId: number, content: string, changeNote: string = '', createdBy: number = 1) {
  const versionStmt = db.prepare('SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM lesson_versions WHERE lesson_id = ?');
  versionStmt.bind([lessonId]);
  let nextVersion = 1;
  if (versionStmt.step()) {
    const row = versionStmt.getAsObject() as { next_version?: number };
    nextVersion = Number(row.next_version || 1);
  }
  versionStmt.free();

  db.run(
    'INSERT INTO lesson_versions (lesson_id, version, content, change_note, created_by) VALUES (?, ?, ?, ?, ?)',
    [lessonId, nextVersion, content, changeNote, createdBy]
  );
  saveDb();
  return nextVersion;
}

export function getLessonVersions(lessonId: number) {
  const rows = db.exec(`
    SELECT id, lesson_id, version, content, change_note, created_by, created_at
    FROM lesson_versions
    WHERE lesson_id = ${lessonId}
    ORDER BY version DESC
  `);

  if (!rows.length) return [];

  return rows[0].values.map(row => ({
    id: row[0],
    lesson_id: row[1],
    version: row[2],
    content: row[3],
    change_note: row[4],
    created_by: row[5],
    created_at: row[6]
  }));
}

export function getUserProgress(userId: number, lessonId: number) {
  const stmt = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ?');
  stmt.bind([userId, lessonId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export function updateUserProgress(userId: number, lessonId: number, completed: boolean, score: number = 0) {
  const existing = getUserProgress(userId, lessonId);
  const completedAt = completed ? new Date().toISOString() : null;
  
  if (existing) {
    db.run(`
      UPDATE user_progress 
      SET completed = ?, score = ?, updated_at = CURRENT_TIMESTAMP,
          completed_at = CASE WHEN ? = 1 AND completed = 0 THEN datetime('now') ELSE completed_at END
      WHERE user_id = ? AND lesson_id = ?
    `, [completed ? 1 : 0, score, completed ? 1 : 0, userId, lessonId]);
  } else {
    db.run(`
      INSERT INTO user_progress (user_id, lesson_id, completed, score, completed_at)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, lessonId, completed ? 1 : 0, score, completedAt]);
  }
  saveDb();
}

export function getUserCourseProgress(userId: number, courseId: number) {
  const lessons = db.exec(`
    SELECT 
      l.id as lesson_id,
      l.title,
      COALESCE(p.completed, 0) as completed,
      COALESCE(p.score, 0) as score
    FROM lessons l
    LEFT JOIN user_progress p ON l.id = p.lesson_id AND p.user_id = ${userId}
    WHERE l.course_id = ${courseId}
    ORDER BY l.order_index
  `);
  
  if (!lessons.length) return [];
  
  return lessons[0].values.map(row => ({
    lesson_id: row[0],
    title: row[1],
    completed: row[2],
    score: row[3]
  }));
}

export function createDraft(creatorId: number, title: string, content: string) {
  db.run('INSERT INTO drafts (creator_id, title, content) VALUES (?, ?, ?)', [creatorId, title, content]);
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveDb();
  return result[0]?.values[0]?.[0];
}

export function getDrafts(creatorId: number) {
  const drafts = db.exec(`SELECT * FROM drafts WHERE creator_id = ${creatorId} ORDER BY updated_at DESC`);
  
  if (!drafts.length) return [];
  
  return drafts[0].values.map(row => ({
    id: row[0],
    creator_id: row[1],
    title: row[2],
    content: row[3],
    status: row[4],
    created_at: row[5],
    updated_at: row[6]
  }));
}

export function updateDraft(id: number, title: string, content: string) {
  db.run('UPDATE drafts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, content, id]);
  saveDb();
}
