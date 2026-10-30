import { Router, Response } from 'express';
import path from 'path';
import { WorkspaceStore, IFileMetadata, IChatMessage } from '../db.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { upload, detectFileType } from '../middleware/upload.js';
import { generateMultimodalStudyResponse, generateStudyGuideFromFiles } from '../gemini.js';

const router = Router();

// Helper to seed a sample workspace if none exist for demo users
export async function ensureDemoWorkspace(userId: string) {
  const existing = await WorkspaceStore.findByUserId(userId);
  if (existing.length === 0) {
    const ws = await WorkspaceStore.create({
      title: 'Neural Networks & Deep Learning Synthesis',
      description: 'Synthesis of CS231n Lecture 4 Audio, Backpropagation Paper (PDF), and Whiteboard Architecture Photo.',
      userId,
    });

    // Add demo simulated files
    const demoFiles: IFileMetadata[] = [
      {
        id: 'file_demo_pdf_1',
        originalName: 'Backpropagation_Foundations.pdf',
        filename: 'Backpropagation_Foundations.pdf',
        mimeType: 'application/pdf',
        size: 2450000,
        fileType: 'document',
        path: 'uploads/Backpropagation_Foundations.pdf',
        url: '/uploads/Backpropagation_Foundations.pdf',
        uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        summary: 'Rigorous derivation of reverse-mode automatic differentiation, gradient descent convergence bounds, and matrix calculus notations.',
      },
      {
        id: 'file_demo_audio_1',
        originalName: 'Lecture_04_Optimization_Notes.mp3',
        filename: 'Lecture_04_Optimization_Notes.mp3',
        mimeType: 'audio/mp3',
        size: 8900000,
        fileType: 'audio',
        path: 'uploads/Lecture_04_Optimization_Notes.mp3',
        url: '/uploads/Lecture_04_Optimization_Notes.mp3',
        uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        summary: 'Professor explains why Adam optimizer momentum dampens oscillations in high curvature ravines, comparing to standard SGD.',
      },
      {
        id: 'file_demo_img_1',
        originalName: 'Whiteboard_Attention_Mechanism.png',
        filename: 'Whiteboard_Attention_Mechanism.png',
        mimeType: 'image/png',
        size: 1420000,
        fileType: 'image',
        path: 'uploads/Whiteboard_Attention_Mechanism.png',
        url: '/uploads/Whiteboard_Attention_Mechanism.png',
        uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        summary: 'Hand-drawn schematic of Scaled Dot-Product Attention: Query, Key, Value vectors multiplied through Softmax matrix scaling factor.',
      },
    ];

    for (const f of demoFiles) {
      await WorkspaceStore.addFile(ws.id, f);
    }

    await WorkspaceStore.addChatMessage(ws.id, {
      id: 'demo_msg_1',
      role: 'user',
      content: 'Can you synthesize how the backpropagation paper connects with what the professor emphasized in the lecture audio?',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      referencedFiles: ['Backpropagation_Foundations.pdf', 'Lecture_04_Optimization_Notes.mp3'],
    });

    await WorkspaceStore.addChatMessage(ws.id, {
      id: 'demo_msg_2',
      role: 'assistant',
      content: `### Cross-Modal Synthesis: Backpropagation & Optimization Dynamics\n\n` +
        `By cross-referencing **[Backpropagation_Foundations.pdf]** with the recording in **[Lecture_04_Optimization_Notes.mp3]**, three essential principles emerge:\n\n` +
        `1. **The Chain Rule in High Dimensions**:\n` +
        `   - *Document Context*: The paper formally establishes the Jacobian vector product $\\frac{\\partial L}{\\partial W^{[l]}} = \\delta^{[l]} (A^{[l-1]})^T$.\n` +
        `   - *Audio Synthesis*: At 14:20 of the lecture audio, the professor notes that in practice, we never instantiate the full Jacobian matrix because it would consume gigabytes of VRAM. Instead, backprop computes the *vector-Jacobian product* iteratively.\n\n` +
        `2. **Vanishing Gradients in Saturated Activations**:\n` +
        `   - The audio specifically highlights why Sigmoid and Tanh decay gradients to near-zero as values saturate at the tails ($f'(x) \\to 0$).\n` +
        `   - The whiteboard schematic **[Whiteboard_Attention_Mechanism.png]** mitigates this by allowing skip-connections and direct value highways.\n\n` +
        `3. **Key Exam Recommendation**:\n` +
        `   Expect questions asking you to compute the backward pass of a multi-head projection layer while explaining why scaling by $\\sqrt{d_k}$ prevents softmax saturation.`,
      timestamp: new Date(Date.now() - 1750000).toISOString(),
      referencedFiles: ['Backpropagation_Foundations.pdf', 'Lecture_04_Optimization_Notes.mp3', 'Whiteboard_Attention_Mechanism.png'],
      suggestedFollowups: [
        'How does scaling by sqrt(d_k) prevent softmax saturation?',
        'Generate a 5-question multiple choice quiz on this topic',
        'Summarize the Adam optimizer momentum equation'
      ],
    });
  }
}

// GET /workspace: List workspaces for authenticated user
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await ensureDemoWorkspace(userId);
    const workspaces = await WorkspaceStore.findByUserId(userId);
    res.json({ success: true, workspaces });
  } catch (err: any) {
    console.error('[Workspace] Fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to load workspaces' });
  }
});

// POST /workspace: Create a new workspace
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, error: 'Workspace title is required' });
      return;
    }

    const newWs = await WorkspaceStore.create({
      title: title.trim(),
      description: description?.trim() || 'Multimodal study workspace for document, audio, and visual synthesis.',
      userId: req.user!.userId,
    });

    res.status(201).json({ success: true, workspace: newWs });
  } catch (err: any) {
    console.error('[Workspace] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create workspace' });
  }
});

// GET /workspace/:id: Get details of a single workspace
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ws = await WorkspaceStore.findById(id);

    if (!ws) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }

    res.json({ success: true, workspace: ws });
  } catch (err: any) {
    console.error('[Workspace] Get error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve workspace' });
  }
});

// PUT /workspace/:id: Update workspace title or description
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const updated = await WorkspaceStore.update(id, {
      ...(title ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }

    res.json({ success: true, workspace: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update workspace' });
  }
});

// DELETE /workspace/:id: Delete workspace
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await WorkspaceStore.delete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }
    res.json({ success: true, message: 'Workspace removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete workspace' });
  }
});

// POST /workspace/:id/upload: Multer upload route
router.post(
  '/:id/upload',
  authMiddleware,
  upload.array('files', 10),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const ws = await WorkspaceStore.findById(id);
      if (!ws) {
        res.status(404).json({ success: false, error: 'Workspace not found' });
        return;
      }

      const rawFiles = req.files as Express.Multer.File[];
      if (!rawFiles || rawFiles.length === 0) {
        res.status(400).json({ success: false, error: 'No files uploaded. Please select PDF, image, or audio files.' });
        return;
      }

      const uploadedMetas: IFileMetadata[] = [];

      for (const file of rawFiles) {
        const fileType = detectFileType(file.mimetype, file.originalname);
        const meta: IFileMetadata = {
          id: 'file_' + Math.random().toString(36).substring(2, 10),
          originalName: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype || 'application/octet-stream',
          size: file.size,
          fileType,
          path: file.path,
          url: `/uploads/${file.filename}`,
          uploadedAt: new Date().toISOString(),
          summary: `${fileType.toUpperCase()} file (${(file.size / 1024).toFixed(1)} KB) indexed for multimodal synthesis.`,
        };

        await WorkspaceStore.addFile(id, meta);
        uploadedMetas.push(meta);
      }

      // Add a system notification message to chat history
      await WorkspaceStore.addChatMessage(id, {
        id: 'sys_' + Date.now(),
        role: 'system',
        content: `📁 **${uploadedMetas.length} new file(s) uploaded:** ${uploadedMetas.map(f => f.originalName).join(', ')}. Indexed into the 3D Multimodal Knowledge Space.`,
        timestamp: new Date().toISOString(),
      });

      const updatedWs = await WorkspaceStore.findById(id);

      res.status(201).json({
        success: true,
        message: `${uploadedMetas.length} file(s) uploaded and indexed successfully`,
        files: uploadedMetas,
        workspace: updatedWs,
      });
    } catch (err: any) {
      console.error('[Upload] Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'File upload failed',
      });
    }
  }
);

// DELETE /workspace/:id/files/:fileId: Remove a file
router.delete('/:id/files/:fileId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, fileId } = req.params;
    const ws = await WorkspaceStore.removeFile(id, fileId);
    if (!ws) {
      res.status(404).json({ success: false, error: 'Workspace or file not found' });
      return;
    }
    res.json({ success: true, workspace: ws });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete file' });
  }
});

// POST /workspace/:id/chat: Multimodal AI Chat Route
router.post('/:id/chat', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { prompt, selectedFileIds, tutorModel, enableSearchGrounding } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ success: false, error: 'Chat prompt cannot be empty' });
      return;
    }

    const ws = await WorkspaceStore.findById(id);
    if (!ws) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }

    // Determine which files to include in multimodal context
    let targetFiles = ws.files;
    if (Array.isArray(selectedFileIds) && selectedFileIds.length > 0) {
      targetFiles = ws.files.filter(f => selectedFileIds.includes(f.id));
    }

    // Append user message to database
    const userMessage: IChatMessage = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date().toISOString(),
      referencedFiles: targetFiles.map(f => f.originalName),
    };
    await WorkspaceStore.addChatMessage(id, userMessage);

    // Call Gemini Multimodal API with Multer file paths
    const mediaInputs = targetFiles.map(f => ({
      filePath: path.isAbsolute(f.path) ? f.path : path.resolve(process.cwd(), f.path),
      mimeType: f.mimeType,
      originalName: f.originalName,
    }));

    const conversationContext = ws.chatHistory
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const aiResult = await generateMultimodalStudyResponse({
      userPrompt: prompt.trim(),
      files: mediaInputs,
      workspaceTitle: ws.title,
      conversationHistory: conversationContext,
      tutorModel: tutorModel || 'gemini-3.8-flash',
      enableSearchGrounding: Boolean(enableSearchGrounding),
    });

    // Save assistant response to database
    const assistantMessage: IChatMessage = {
      id: 'msg_asst_' + Date.now(),
      role: 'assistant',
      content: aiResult.text,
      timestamp: new Date().toISOString(),
      referencedFiles: aiResult.referencedFiles,
      suggestedFollowups: aiResult.suggestedFollowups,
      modelUsed: aiResult.modelUsed,
      groundingSources: aiResult.groundingSources,
      searchQueries: aiResult.searchQueries,
    };
    await WorkspaceStore.addChatMessage(id, assistantMessage);

    const updatedWs = await WorkspaceStore.findById(id);

    res.json({
      success: true,
      userMessage,
      assistantMessage,
      workspace: updatedWs,
    });
  } catch (err: any) {
    console.error('[Chat] Multimodal error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error communicating with Gemini Multimodal AI',
    });
  }
});

// POST /workspace/:id/study-guide: Generate comprehensive study guide
router.post('/:id/study-guide', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ws = await WorkspaceStore.findById(id);
    if (!ws) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }

    const mediaInputs = ws.files.map(f => ({
      filePath: path.isAbsolute(f.path) ? f.path : path.resolve(process.cwd(), f.path),
      mimeType: f.mimeType,
      originalName: f.originalName,
    }));

    const studyGuideText = await generateStudyGuideFromFiles({
      workspaceTitle: ws.title,
      files: mediaInputs,
    });

    await WorkspaceStore.update(id, { studyGuide: studyGuideText });

    res.json({
      success: true,
      studyGuide: studyGuideText,
    });
  } catch (err: any) {
    console.error('[StudyGuide] Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to generate study guide' });
  }
});

export default router;
