import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ShotListItem {
  sceneNumber: string;
  location: string;
  timeOfDay: string;
  action: string;
  dialogue: string;
  notes: string;
}

// Get API key from admin settings first, fallback to env var
export async function getGeminiClient(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY || '';
  return new GoogleGenerativeAI(key);
}

function extractJsonArray(text: string): unknown[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const jsonMatch = candidate.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return [];
    }
  }
  return [];
}

export async function generateScript(
  idea: string,
  model: string = 'gemini-2.0-flash',
  systemPrompt?: string
): Promise<string> {
  const genAI = await getGeminiClient();
  const geminiModel = genAI.getGenerativeModel({ model });
  const prompt = systemPrompt
    ? `${systemPrompt}\n\nTransform this idea into a detailed cinematic script:\n${idea}`
    : `You are a professional screenwriter. Transform this idea into a detailed cinematic script with proper formatting. Include scene headings, action lines, and dialogue. Idea: ${idea}`;
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

export async function generateShotList(
  script: string,
  model: string = 'gemini-2.0-flash'
): Promise<ShotListItem[]> {
  const genAI = await getGeminiClient();
  const geminiModel = genAI.getGenerativeModel({ model });
  const prompt = `Analyze this script and create a detailed shot list. Return ONLY a JSON array with objects having these fields: sceneNumber, location, timeOfDay, action, dialogue, notes. Script:\n${script}`;
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  return extractJsonArray(text) as ShotListItem[];
}

export async function generateStoryboardPrompts(
  shotList: ShotListItem[],
  style: string,
  model: string = 'gemini-2.0-flash'
): Promise<string[]> {
  const genAI = await getGeminiClient();
  const geminiModel = genAI.getGenerativeModel({ model });
  const prompt = `Create image generation prompts for each shot in this shot list. Style: ${style}. Shot list: ${JSON.stringify(
    shotList
  )}. Return ONLY a JSON array of strings, one prompt per shot.`;
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  return extractJsonArray(text) as string[];
}

export async function generateCharacterDescription(
  name: string,
  context: string,
  model: string = 'gemini-2.0-flash'
): Promise<string> {
  const genAI = await getGeminiClient();
  const geminiModel = genAI.getGenerativeModel({ model });
  const prompt = `Create a detailed visual character description for "${name}" based on this context: ${context}. Include physical appearance, clothing, distinctive features.`;
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

export async function generateStyleDescription(
  idea: string,
  model: string = 'gemini-2.0-flash'
): Promise<string> {
  const genAI = await getGeminiClient();
  const geminiModel = genAI.getGenerativeModel({ model });
  const prompt = `Based on this creative idea, suggest a visual style for a storyboard/animation. Include: color palette, lighting style, artistic references, mood, cinematography style. Idea: ${idea}`;
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

// Image generation via the Gemini / Imagen REST API. The JS SDK does not
// directly support image generation, so we call the REST endpoint.
export async function generateImage(
  prompt: string,
  model: string = 'imagen-3.0-generate-002',
  apiKey?: string
): Promise<string | null> {
  const key = apiKey || process.env.GEMINI_API_KEY || '';
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: '16:9' },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (b64) {
      return `data:image/png;base64,${b64}`;
    }
    return null;
  } catch {
    return null;
  }
}

// Video generation via the Gemini Veo REST API. Returns an operation name or
// a video URL depending on the API response.
export async function generateVideo(
  prompt: string,
  imageUrl?: string,
  model: string = 'veo-2.0-generate-001',
  apiKey?: string
): Promise<{ operationName?: string; videoUrl?: string } | null> {
  const key = apiKey || process.env.GEMINI_API_KEY || '';
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { aspectRatio: '16:9' },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { operationName: data?.name };
  } catch {
    return null;
  }
}
