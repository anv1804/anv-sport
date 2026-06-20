import { getSports, getCountries, getLeagues } from "./actions";
import GeneralDataClient from "./GeneralDataClient";
import { AdminPageHeader } from "@/components/shared/AdminPageHeader";
import { Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GeneralDataPage() {
  const [sports, countries, leagues] = await Promise.all([
    getSports(),
    getCountries(),
    getLeagues(),
  ]);

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Dữ Liệu Chung"
        description="Quản lý Môn Thể Thao, Quốc Gia và Giải Đấu tập trung."
      />

      <GeneralDataClient 
        initialSports={sports} 
        initialCountries={countries} 
        initialLeagues={leagues} 
      />
    </div>
  );
}
