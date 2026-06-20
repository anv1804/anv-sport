"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleAdStatus(id: string, currentStatus: boolean) {
  await prisma.adPlacement.update({
    where: { id },
    data: { isActive: !currentStatus }
  });
  revalidatePath("/admin/ads");
  revalidatePath("/");
}

export async function updateAd(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const linkUrl = formData.get("linkUrl") as string;

  if (id) {
    await prisma.adPlacement.update({
      where: { id },
      data: { name, imageUrl, linkUrl }
    });
  } else {
    // If we want to allow creating new ones, though usually slots are fixed
    const slotId = formData.get("slotId") as string;
    await prisma.adPlacement.create({
      data: { slotId, name, imageUrl, linkUrl, isActive: true }
    });
  }
  
  revalidatePath("/admin/ads");
  revalidatePath("/");
}

export async function seedInitialAds() {
  const count = await prisma.adPlacement.count();
  if (count === 0) {
    await prisma.adPlacement.createMany({
      data: [
        { slotId: "Top_Banner", name: "Banner Đầu Trang", imageUrl: "/ads/top-banner.jpg", linkUrl: "https://shopee.vn" },
        { slotId: "In_Feed_Left", name: "Banner Cột Trái", imageUrl: "https://placehold.co/300x600/16A34A/FFF?text=Banner", linkUrl: "https://tiki.vn" },
        { slotId: "Sidebar_1", name: "Banner Sidebar 1", imageUrl: "/ads/sidebar1.jpg", linkUrl: "https://lazada.vn" }
      ]
    });
  }
  revalidatePath("/admin/ads");
}

export async function getAds() {
  try {
    const ads = await prisma.adPlacement.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: ads };
  } catch (error) {
    console.error('Lỗi khi lấy quảng cáo:', error);
    return { success: false, error: 'Không thể tải danh sách quảng cáo' };
  }
}
