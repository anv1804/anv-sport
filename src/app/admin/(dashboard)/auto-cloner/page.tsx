import prisma from "@/lib/prisma";
import { getClonerSources } from "./actions";
import { AutoClonerClient } from "@/components/domain/settings/AutoClonerClient";

export const dynamic = "force-dynamic";

export default async function AutoClonerPage() {
  const sources = await getClonerSources();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { name: "asc" }
  });

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AutoClonerClient sources={sources as any} categories={categories} />
    </div>
  );
}
