import OpenAI from 'openai';
import prisma from './prisma';

const DEFAULT_MODELS = [
  'deepseek-v4-flash',
  'deepseek-v4-flash[1m]',
  'kimi-k2.6',
  'kimi-k2.5',
  'deepseek-v4-pro'
];

let globalLastSuccessfulModel: string | null = null;

export async function generateWithFallback(
  prompt: string,
  systemInstruction: string = 'You are a highly capable AI assistant.',
  isJson: boolean = true,
  fallbackModels: string[] = DEFAULT_MODELS
) {
  // Ưu tiên đọc từ DB (Bảng Setting)
  const dbKey = await prisma.setting.findUnique({ where: { key: 'AI_BOX_API_KEY' } });
  const dbUrl = await prisma.setting.findUnique({ where: { key: 'AI_BOX_BASE_URL' } });

  const aiKey = dbKey?.value || process.env.AI_BOX_API_KEY;
  const aiBaseUrl = dbUrl?.value || process.env.AI_BOX_BASE_URL || 'https://api.ai-box.vn';

  if (!aiKey) throw new Error('Chưa cấu hình AI_BOX_API_KEY trong hệ thống (Settings hoặc .env)');

  const openai = new OpenAI({
    apiKey: aiKey,
    baseURL: aiBaseUrl.endsWith('/v1') ? aiBaseUrl : `${aiBaseUrl}/v1`,
  });

  let resultText = "{}";
  let aiSuccess = false;
  let lastError = "";
  let finalModel = "";
  let actualTokenCount = 0;
  const startTime = Date.now();

  let modelsToTry = [...fallbackModels];
  if (globalLastSuccessfulModel && modelsToTry.includes(globalLastSuccessfulModel)) {
    modelsToTry = [
      globalLastSuccessfulModel,
      ...modelsToTry.filter(m => m !== globalLastSuccessfulModel)
    ];
  }

  for (const modelName of modelsToTry) {
    console.log(`[AI Box] Đang thử gọi model: ${modelName}...`);
    try {
      const messages: any[] = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const requestOptions: any = {
        model: modelName,
        messages: messages,
        temperature: 0.7,
      };

      if (isJson) {
        requestOptions.response_format = { type: 'json_object' };
      }

      const fetchPromise = openai.chat.completions.create(requestOptions);

      // Timeout cứng 45 giây cho mỗi lần thử
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout (45s) cho model ${modelName}`)), 45000)
      );
      
      const response: any = await Promise.race([fetchPromise, timeoutPromise]);
      
      let rawText = response.choices[0]?.message?.content || "";
      if (isJson) {
        rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      }
      resultText = rawText;
      
      // Lấy chính xác số token từ API trả về, fallback bằng tính thủ công nếu API không trả
      actualTokenCount = response.usage?.total_tokens || Math.floor((prompt.length + systemInstruction.length + rawText.length) / 3);
      
      console.log(`[AI Box] Hoàn thành với model (${modelName}) thành công!`);
      aiSuccess = true;
      finalModel = modelName;
      globalLastSuccessfulModel = modelName; // Ghi nhớ model thành công
      break; // Thoát vòng lặp nếu thành công
    } catch (err: any) {
      console.warn(`[AI Box] Gọi model (${modelName}) thất bại:`, err.message);
      lastError = err.message;
      finalModel = modelName;
      
      // Đợi 2s trước khi chuyển sang model tiếp theo để tránh bị spam rate limit liên tục
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const durationMs = Date.now() - startTime;
  
  // Tính token thủ công tương đối (3 char = 1 token) chỉ dùng khi gọi API thất bại
  const fallbackTokenCount = Math.floor((prompt.length + systemInstruction.length + resultText.length) / 3);
  const tokenCountToSave = aiSuccess && actualTokenCount > 0 ? actualTokenCount : fallbackTokenCount;

  try {
    await prisma.aILog.create({
      data: {
        prompt: prompt.substring(0, 1000), // Lưu 1000 ký tự đầu tiên
        modelUsed: finalModel,
        status: aiSuccess ? 'SUCCESS' : 'ERROR',
        errorMessage: aiSuccess ? null : lastError,
        tokenCount: tokenCountToSave,
        durationMs: durationMs,
      }
    });
  } catch (logError) {
    console.error("Lỗi khi ghi AILog:", logError);
  }

  if (!aiSuccess) {
    throw new Error(`AI Box provider lỗi liên tục: ${lastError}`);
  }

  return resultText;
}
