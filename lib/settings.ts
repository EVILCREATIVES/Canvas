import { db } from '@/lib/db';
import { adminSettings, type AdminSetting } from '@/lib/db/schema';

const DEFAULTS = {
  modelName: 'gemini-2.0-flash',
  imageModel: 'imagen-3.0-generate-002',
  videoModel: 'veo-2.0-generate-001',
  aiRules: null as string | null,
  systemPrompt: null as string | null,
};

export async function getAdminSettings(): Promise<
  Pick<
    AdminSetting,
    'modelName' | 'imageModel' | 'videoModel' | 'aiRules' | 'systemPrompt'
  >
> {
  try {
    const [row] = await db.select().from(adminSettings).limit(1);
    if (row) {
      return {
        modelName: row.modelName,
        imageModel: row.imageModel,
        videoModel: row.videoModel,
        aiRules: row.aiRules,
        systemPrompt: row.systemPrompt,
      };
    }
  } catch {
    // fall back to defaults if the DB is unavailable
  }
  return DEFAULTS;
}
