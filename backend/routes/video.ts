import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { generateConceptVideo } from '../gemini.js';

const router = Router();

// POST /api/video/generate
router.post('/generate', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ success: false, error: 'A video generation prompt is required' });
      return;
    }

    const ratio = aspectRatio === '9:16' ? '9:16' : '16:9';

    const result = await generateConceptVideo({
      prompt: prompt.trim(),
      aspectRatio: ratio,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('[Video Route] Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Video generation failed',
    });
  }
});

export default router;
