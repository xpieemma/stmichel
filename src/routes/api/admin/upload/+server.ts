import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { R2_PUBLIC_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
  // 1. Security Check
  if (!cookies.get('admin_session')) return json({ error: 'Unauthorized' }, { status: 401 });
  
  // 2. Make sure R2 is connected in your wrangler.toml
  const r2 = platform?.env?.R2; // Replace 'R2' with your actual binding name if different
  if (!r2) return json({ error: 'R2 storage unavailable' }, { status: 500 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) return json({ error: 'No file provided' }, { status: 400 });

    // 3. Strict Type Checking (Only JPG and WebP)
    if (!['image/jpeg', 'image/webp'].includes(file.type)) {
      return json({ error: 'Only JPG and WebP files are allowed' }, { status: 400 });
    }

    // 4. Create a unique, clean filename
    const ext = file.type === 'image/webp' ? 'webp' : 'jpg';
    const cleanName = file.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const filename = `albums/${Date.now()}-${cleanName}.${ext}`;

    // 5. Upload to Cloudflare R2
    const arrayBuffer = await file.arrayBuffer();
    await r2.put(filename, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    // 6. Return the public URL
    // ⚠️ IMPORTANT: Replace this with your actual R2 public domain!
    const publicUrl = `${R2_PUBLIC_URL}/${filename}`;
    

    return json({ url: publicUrl });

  } catch (error) {
    console.error('Upload error:', error);
    return json({ error: 'Failed to upload image' }, { status: 500 });
  }
};