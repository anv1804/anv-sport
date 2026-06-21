import SupercomputerClient from "@/components/domain/settings/SupercomputerClient";

export const dynamic = "force-dynamic";

export default function SupercomputerPage() {
  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SupercomputerClient />
    </div>
  );
}
