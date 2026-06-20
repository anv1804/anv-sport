"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

export async function saveAISettings(formData: FormData) {
  try {
    const apiKey = formData.get("apiKey") as string;
    const baseUrl = formData.get("baseUrl") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (apiKey) {
      await prisma.setting.upsert({
        where: { key: "AI_BOX_API_KEY" },
        update: { value: apiKey },
        create: { key: "AI_BOX_API_KEY", value: apiKey, description: "API Key cho AI Box" },
      });
    }

    if (baseUrl) {
      await prisma.setting.upsert({
        where: { key: "AI_BOX_BASE_URL" },
        update: { value: baseUrl },
        create: { key: "AI_BOX_BASE_URL", value: baseUrl, description: "Base URL cho AI Box" },
      });
    }

    if (username) {
      await prisma.setting.upsert({
        where: { key: "AI_BOX_USERNAME" },
        update: { value: username },
        create: { key: "AI_BOX_USERNAME", value: username, description: "Username AI Box" },
      });
    }

    if (password) {
      await prisma.setting.upsert({
        where: { key: "AI_BOX_PASSWORD" },
        update: { value: password },
        create: { key: "AI_BOX_PASSWORD", value: password, description: "Password AI Box" },
      });
    }

    revalidatePath("/admin/settings/ai");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi lưu cấu hình AI:", error);
    return { success: false, error: error.message };
  }
}

export async function getAISettings() {
  const apiKey = await prisma.setting.findUnique({ where: { key: "AI_BOX_API_KEY" } });
  const baseUrl = await prisma.setting.findUnique({ where: { key: "AI_BOX_BASE_URL" } });
  const username = await prisma.setting.findUnique({ where: { key: "AI_BOX_USERNAME" } });
  const password = await prisma.setting.findUnique({ where: { key: "AI_BOX_PASSWORD" } });

  return {
    apiKey: apiKey?.value || process.env.AI_BOX_API_KEY || "",
    baseUrl: baseUrl?.value || process.env.AI_BOX_BASE_URL || "https://api.ai-box.vn",
    username: username?.value || process.env.AI_BOX_USERNAME || "",
    password: password?.value || process.env.AI_BOX_PASSWORD || "",
  };
}

export async function getAILogs(limit = 10, skip = 0) {
  try {
    const logs = await prisma.aILog.findMany({
      take: limit,
      skip: skip,
      orderBy: { createdAt: "desc" },
    });
    return logs;
  } catch (error) {
    console.error("Lỗi lấy lịch sử AI:", error);
    return [];
  }
}

export async function getAILogStats() {
  try {
    const totalCalls = await prisma.aILog.count();
    const errorCalls = await prisma.aILog.count({ where: { status: "ERROR" } });
    const successCalls = totalCalls - errorCalls;
    
    // Sum tokens
    const tokenAgg = await prisma.aILog.aggregate({
      _sum: { tokenCount: true }
    });
    
    return {
      totalCalls,
      successCalls,
      errorCalls,
      totalTokens: tokenAgg._sum.tokenCount || 0
    };
  } catch (error) {
    return {
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0,
      totalTokens: 0
    };
  }
}

export async function testAIConnection() {
  try {
    const settings = await getAISettings();
    if (!settings.apiKey) {
      return { success: false, error: "Chưa cấu hình API Key" };
    }

    const openai = new OpenAI({
      apiKey: settings.apiKey,
      baseURL: settings.baseUrl.endsWith('/v1') ? settings.baseUrl : `${settings.baseUrl}/v1`,
    });

    const modelsResponse = await openai.models.list();
    const models = modelsResponse.data.map((m: any) => m.id);

    return { 
      success: true, 
      models: models.length > 0 ? models : ["Không tìm thấy model nào"]
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi kết nối" };
  }
}
