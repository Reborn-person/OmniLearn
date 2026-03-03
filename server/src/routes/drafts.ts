import { Router } from 'express';
import { createDraft, getDrafts, updateDraft } from '../db/index.js';

const router = Router();

// Get all drafts for current user
router.get('/', (req, res) => {
  try {
    // For now, use user_id from query (in real app, get from session)
    const userId = parseInt(req.query.userId as string) || 1;
    const drafts = getDrafts(userId);
    res.json(drafts);
  } catch (error) {
    console.error('Error getting drafts:', error);
    res.status(500).json({ error: 'Failed to get drafts' });
  }
});

// Create new draft
router.post('/', (req, res) => {
  try {
    const { title, content, userId } = req.body;
    const creatorId = userId || 1;
    const id = createDraft(creatorId, title, content);
    res.json({ id, message: 'Draft created' });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ error: 'Failed to create draft' });
  }
});

// Update existing draft
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    updateDraft(parseInt(id), title, content);
    res.json({ message: 'Draft updated' });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

export default router;