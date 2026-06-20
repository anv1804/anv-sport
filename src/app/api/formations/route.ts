import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tactical_formations')
      .select('name, coordinates');

    if (error) throw error;
    
    // Convert to a dictionary for easy O(1) lookup on frontend
    const dict = data.reduce((acc: any, row: any) => {
      acc[row.name] = row.coordinates;
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: dict });
  } catch (error) {
    console.error("API Error (Formations):", error);
    return NextResponse.json({ success: false, error: "Lỗi lấy dữ liệu sơ đồ chiến thuật" }, { status: 500 });
  }
}
