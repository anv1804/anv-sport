import { PostForm } from "@/components/admin/PostForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  
  if (isNaN(id)) {
    notFound();
  }

  const post = await prisma.post.findUnique({
    where: { id }
  });

  if (!post) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  return <PostForm initialData={post} categories={categories} />;
}
