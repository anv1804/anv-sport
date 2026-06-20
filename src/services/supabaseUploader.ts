import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadToSupabase(imageUrl: string): Promise<string | null> {
  try {

    // 1. Fetch image from original URL with User-Agent to bypass basic hotlink protections
    let response;
    try {
      response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // If forbidden or error, try fallback to proxy
      if (!response.ok) {
        console.warn(`[Supabase Uploader] Direct fetch failed (${response.status}) for: ${imageUrl}. Trying proxy...`);
        const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, "");
        const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(urlWithoutProtocol)}`;
        response = await fetch(proxiedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      }
    } catch (e) {
      console.warn(`[Supabase Uploader] Fetch exception for ${imageUrl}, trying proxy...`);
      const urlWithoutProtocol = imageUrl.replace(/^https?:\/\//, "");
      const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(urlWithoutProtocol)}`;
      response = await fetch(proxiedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    }

    if (!response || !response.ok) {
      console.warn(`[Supabase Uploader] Completely failed to fetch image: ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 2. Extract content type or default to jpeg
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // 3. Generate unique filename
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('gif')) extension = 'gif';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('svg')) extension = 'svg';

    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `crawled_${timestamp}_${randomStr}.${extension}`;

    // 4. Upload to Supabase Storage (bucket name: 'images')
    let { data, error } = await supabaseAdmin
      .storage
      .from('images')
      .upload(filename, buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    // Tự động tạo bucket nếu chưa có
    if (error && (error.message.includes('Bucket not found') || error.message.includes('not found') || (error as any).statusCode === '404')) {
      console.log("Bucket 'images' chưa tồn tại, đang tự động tạo mới...");
      await supabaseAdmin.storage.createBucket('images', { public: true });
      
      const retry = await supabaseAdmin.storage.from('images').upload(filename, buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      console.warn(`Failed to upload to Supabase: ${error?.message || 'Unknown error'}`);
      return null;
    }

    // 5. Get public URL
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from('images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Supabase upload error:", error);
    return null;
  }
}
