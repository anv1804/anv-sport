import { PostForm } from "@/components/admin/PostForm";
import prisma from "@/lib/prisma";

export default async function NewPostPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  
  return <PostForm categories={categories} />;
}
