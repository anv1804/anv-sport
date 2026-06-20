export async function uploadToTelegraph(imageUrl: string): Promise<string | null> {
  try {
    // 1. Fetch image from original URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 2. Extract content type or default to jpeg
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // 3. Create Blob for FormData
    const blob = new Blob([buffer], { type: contentType });
    
    const formData = new FormData();
    // Telegra.ph requires a filename to be present
    let filename = 'image.jpg';
    if (contentType.includes('png')) filename = 'image.png';
    else if (contentType.includes('gif')) filename = 'image.gif';
    else if (contentType.includes('mp4')) filename = 'video.mp4';

    formData.append('file', blob, filename);

    // 4. Upload to Telegra.ph
    const uploadRes = await fetch('https://telegra.ph/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      console.warn(`Failed to upload to Telegraph: ${uploadRes.statusText}`);
      return null;
    }

    const data = await uploadRes.json();
    
    // data format: [{"src":"/file/12345abcde.jpg"}]
    if (data && Array.isArray(data) && data[0] && data[0].src) {
      return `https://telegra.ph${data[0].src}`;
    }
    
    return null;
  } catch (error) {
    console.error("Telegraph upload error:", error);
    return null;
  }
}
