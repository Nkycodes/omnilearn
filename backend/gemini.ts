import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface MediaPartInput {
  filePath: string;
  mimeType: string;
  originalName: string;
}

export type TutorModelTier = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface MultimodalResponseResult {
  text: string;
  referencedFiles: string[];
  suggestedFollowups: string[];
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
  modelUsed: string;
}

/**
 * Reads local Multer files and converts them to Gemini inlineData parts.
 */
export async function prepareFileParts(files: MediaPartInput[]): Promise<any[]> {
  const parts: any[] = [];

  for (const file of files) {
    try {
      if (!fs.existsSync(file.filePath)) continue;

      const fileBuffer = fs.readFileSync(file.filePath);
      const base64Data = fileBuffer.toString('base64');

      let mime = file.mimeType;
      // Normalize common MIME types
      if (file.originalName.endsWith('.pdf')) mime = 'application/pdf';
      if (file.originalName.endsWith('.mp3')) mime = 'audio/mp3';
      if (file.originalName.endsWith('.wav')) mime = 'audio/wav';
      if (file.originalName.endsWith('.m4a')) mime = 'audio/m4a';
      if (file.originalName.endsWith('.png')) mime = 'image/png';
      if (file.originalName.endsWith('.jpg') || file.originalName.endsWith('.jpeg')) mime = 'image/jpeg';
      if (file.originalName.endsWith('.webp')) mime = 'image/webp';

      parts.push({
        inlineData: {
          mimeType: mime,
          data: base64Data,
        },
      });
    } catch (err) {
      console.warn(`[Gemini] Failed to read file ${file.originalName}:`, err);
    }
  }

  return parts;
}

/**
 * Generates an automated comprehensive Study Guide from all workspace files.
 */
export async function generateStudyGuideFromFiles({
  workspaceTitle,
  files,
}: {
  workspaceTitle: string;
  files: MediaPartInput[];
}): Promise<string> {
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return `# Comprehensive Study Guide: ${workspaceTitle}\n\n` +
      `## 1. Executive Summary\n` +
      `This study guide synthesizes key concepts from ${files.length} uploaded study artifact(s):\n` +
      files.map(f => `- **${f.originalName}**`).join('\n') +
      `\n\n## 2. Core Themes & Definitions\n` +
      `- **Primary Subject**: Foundational concepts and methodologies.\n` +
      `- **Key Principle**: Interconnecting visual models with acoustic lecture explanations.\n\n` +
      `## 3. High-Yield Exam Review Points\n` +
      `1. Master the terminology highlighted across both the documents and lecture audio.\n` +
      `2. Practice drawing the schematic diagrams from memory.\n` +
      `3. Be prepared to compare and contrast alternative approaches discussed in the materials.\n\n` +
      `*(Configure GEMINI_API_KEY in Secrets for live AI-generated multi-page guides)*`;
  }

  const fileParts = await prepareFileParts(files);
  const prompt = `Generate a master-level, highly structured Study Guide for the project "${workspaceTitle}".
Include:
1. Executive Summary & Core Objectives
2. Key Concepts & Definitions Table/List (citing which file it came from)
3. Deep-Dive Section: Synthesizing the readings, lecture audio points, and visual diagrams
4. Common Exam Pitfalls & Misconceptions
5. Quick Review Flashcard Prompts
Use clean, beautifully formatted Markdown with bold highlights, tables, and blockquotes.`;

  const contents = [...fileParts, { text: prompt }];

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents,
    config: {
      systemInstruction: 'You are an academic researcher and master educator producing high-yield study guides.',
    },
  });

  return response.text || '# Study Guide\n\nUnable to generate guide content.';
}

/**
 * Sends a multimodal synthesis query with support for:
 * - Model tiers: gemini-4-argon (Master Professor), gemini-3.8-flash (Synthesizer), gemini-3.1-flash-lite (Speed Quizzer)
 * - Google Search Grounding with web citations
 */
export async function generateMultimodalStudyResponse({
  userPrompt,
  files,
  workspaceTitle,
  conversationHistory = [],
  tutorModel = 'gemini-3.8-flash',
  enableSearchGrounding = false,
}: {
  userPrompt: string;
  files: MediaPartInput[];
  workspaceTitle: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  tutorModel?: TutorModelTier;
  enableSearchGrounding?: boolean;
}): Promise<MultimodalResponseResult> {
  const referencedNames = files.map(f => f.originalName);

  // System Persona based on selected tier
  let personaInstruction = '';
  if (tutorModel === 'gemini-4-argon') {
    personaInstruction = `You are a distinguished Academic Professor & Lead Researcher. 
Workspace: "${workspaceTitle}".
Provide deep mathematical rigor, conceptual derivations, and exhaustive multi-modal analysis across the student's materials.
Cite specific materials using [Filename] tags. When presenting equations, use clean LaTeX formatting.`;
  } else if (tutorModel === 'gemini-3.1-flash-lite') {
    personaInstruction = `You are an ultra-fast Speed Quizmaster & Flashcard Coach.
Workspace: "${workspaceTitle}".
Deliver rapid, high-yield summaries, bite-sized quiz challenges, and flashcard drills based on the uploaded materials. Keep responses crisp, actionable, and punchy.`;
  } else {
    personaInstruction = `You are OmniLearn, an expert autonomous Multimodal AI Study Assistant.
Workspace: "${workspaceTitle}".
Synthesize insights across the provided media files (connect lecture audio, readings, diagrams, and photos).
Explicitly cite which file (e.g. [Reading.pdf], [Lecture.mp3]) each insight came from.
Format response with clear headings, bullet points, and key takeaways.`;
  }

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      text: `### Multimodal Synthesis [Model: ${tutorModel}]\n\n` +
        `> **Note:** To enable live Gemini generation, configure your \`GEMINI_API_KEY\` in the **Settings > Secrets** panel.\n\n` +
        `**Contextual Analysis based on ${files.length} uploaded material(s):**\n\n` +
        files.map(f => `- **${f.originalName}** (${f.mimeType}): Indexed and aligned in the Multimodal Knowledge Graph.`).join('\n') +
        `\n\n**Synthesized Answer:**\n` +
        `Based on your query: *"${userPrompt}"*, here is the cross-media analysis:\n` +
        `1. **Core Concept Synthesis:** Your study materials form a connected thematic triad. The lecture audio establishes the conceptual intuition, while the textbook notes ground it in mathematical definitions.\n` +
        `2. **Visual & Diagrammatic Evidence:** Any whiteboard diagrams or figures act as structural anchors for exam recall.\n` +
        `3. **Key Takeaway:** Focus on the cross-cutting terminology defined across both the reading and recorded explanation for maximum retention.`,
      referencedFiles: referencedNames,
      suggestedFollowups: [
        "Generate a structured 5-point study guide",
        "Create 3 practice multiple-choice questions",
        "Summarize the audio notes into bullet points"
      ],
      modelUsed: tutorModel,
    };
  }

  try {
    const fileParts = await prepareFileParts(files);
    const contents: any[] = [];

    // Add file attachments
    if (fileParts.length > 0) {
      contents.push(...fileParts);
    }

    // Add prior conversation context for continuity
    const recentHistory = conversationHistory.slice(-4);
    for (const msg of recentHistory) {
      contents.push({
        text: `${msg.role === 'user' ? 'Student' : 'OmniLearn'}: ${msg.content}`,
      });
    }

    // Add student prompt
    contents.push({
      text: `Student Question: ${userPrompt}\n\nPlease synthesize the uploaded materials and answer thoroughly.`,
    });

    const config: any = {
      systemInstruction: personaInstruction,
    };

    // Google Search Grounding is supported on gemini-3.8-flash and gemini-4-argon
    if (enableSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    // Select target model (fallback to gemini-3.8-flash if search grounding is enabled on models that require it)
    const effectiveModel = enableSearchGrounding ? 'gemini-3.8-flash' : tutorModel;

    const response = await ai.models.generateContent({
      model: effectiveModel,
      contents,
      config,
    });

    const outputText = response.text || 'Unable to generate response. Please try rephrasing your question.';

    // Extract grounding sources if available
    const groundingSources: GroundingSource[] = [];
    const searchQueries: string[] = [];

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    if (groundingMetadata) {
      if (Array.isArray(groundingMetadata.webSearchQueries)) {
        searchQueries.push(...groundingMetadata.webSearchQueries);
      }
      if (Array.isArray(groundingMetadata.groundingChunks)) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            });
          }
        }
      }
    }

    // Extract suggested follow-ups
    const followups: string[] = [
      "Can you create a quick 3-question quiz on this topic?",
      "Summarize the most important exam takeaways",
      "Explain the connection between the audio and reading materials"
    ];

    return {
      text: outputText,
      referencedFiles: referencedNames,
      suggestedFollowups: followups,
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
      searchQueries: searchQueries.length > 0 ? searchQueries : undefined,
      modelUsed: effectiveModel,
    };
  } catch (err: any) {
    console.error(`[Gemini] Error with model ${tutorModel}:`, err);
    throw new Error(err.message || 'Failed to generate multimodal AI response');
  }
}

/**
 * Text-to-Video generation using gemini-omni-1.1-flash via Interactions API.
 * Supports aspect_ratio: '16:9' or '9:16'.
 */
export async function generateConceptVideo({
  prompt,
  aspectRatio = '16:9',
}: {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
}): Promise<{ videoUrl: string; duration: string; prompt: string; isSimulated?: boolean }> {
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Generate a high-fidelity SVG/Canvas video concept preview when no paid key is active
    return {
      videoUrl: createSimulatedVideoDataUrl(prompt, aspectRatio),
      duration: '5s',
      prompt,
      isSimulated: true,
    };
  }

  try {
    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: `Educational scientific animation: ${prompt}. High clarity, academic diagrammatic style, smooth motion.`,
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio,
          duration: '5s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const mime = videoPart.mime_type || 'video/mp4';
      return {
        videoUrl: `data:${mime};base64,${videoPart.data}`,
        duration: '5s',
        prompt,
      };
    }

    // Fallback if video output format was returned as URI or empty
    return {
      videoUrl: createSimulatedVideoDataUrl(prompt, aspectRatio),
      duration: '5s',
      prompt,
      isSimulated: true,
    };
  } catch (err: any) {
    console.warn('[Gemini Omni] Video generation warning (falling back to interactive visual simulation):', err.message);
    return {
      videoUrl: createSimulatedVideoDataUrl(prompt, aspectRatio),
      duration: '5s',
      prompt,
      isSimulated: true,
    };
  }
}

/**
 * Procedural animated canvas/SVG video simulation helper
 */
function createSimulatedVideoDataUrl(prompt: string, aspectRatio: '16:9' | '9:16'): string {
  const width = aspectRatio === '16:9' ? 640 : 360;
  const height = aspectRatio === '16:9' ? 360 : 640;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0f1d" />
        <stop offset="50%" stop-color="#141e33" />
        <stop offset="100%" stop-color="#050811" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#06b6d4" />
      </linearGradient>
      <filter id="blur">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)" rx="12" />
    
    <!-- Animated Orbits -->
    <g transform="translate(${width / 2}, ${height / 2})">
      <circle r="90" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle r="130" fill="none" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="12 8" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="12s" repeatCount="indefinite" />
      </circle>
      
      <!-- Core Pulsing Node -->
      <circle r="36" fill="url(#glow)" filter="url(#blur)" opacity="0.5">
        <animate attributeName="r" values="32;42;32" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle r="28" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
      
      <!-- Scientific Glyph -->
      <path d="M-10,-10 L10,10 M-10,10 L10,-10 M0,-14 L0,14 M-14,0 L14,0" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
      
      <!-- Satellite Nodes -->
      <circle cx="90" cy="0" r="8" fill="#06b6d4">
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="-130" cy="0" r="10" fill="#a855f7">
        <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="12s" repeatCount="indefinite" />
      </circle>
    </g>
    
    <!-- Title and Concept Label -->
    <rect x="20" y="${height - 75}" width="${width - 40}" height="55" rx="8" fill="#030712" fill-opacity="0.8" stroke="#1f2937" />
    <text x="${width / 2}" y="${height - 50}" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">
      OmniLearn Multimodal Concept Video (gemini-omni-1.1-flash)
    </text>
    <text x="${width / 2}" y="${height - 30}" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">
      ${prompt.length > 55 ? prompt.substring(0, 52) + '...' : prompt}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
