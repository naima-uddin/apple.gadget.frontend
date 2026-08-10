const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

// Mirror the old server-side sharp step so stored files stay small.
const MAX_WIDTH = 1600;
const QUALITY = 0.75;

// Single source of truth for the upload size limit. Anything up to this uploads
// freely with no restriction; anything larger is rejected before we hit the
// network. Keep this in sync with the backend multer `fileSize` limits.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// Throws a clear (Bangla) error if the file is over the 10MB limit. Files at or
// under the limit pass silently — no restriction message is shown.
export function assertUploadSize(file) {
  if (file && file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(
      `"${file.name}" সাইজ ${mb}MB — সর্বোচ্চ ১০MB পর্যন্ত আপলোড করা যাবে।`,
    );
  }
}

async function canvasToBlob(canvas) {
  // Prefer webp (smallest); fall back to jpeg if the browser can't encode webp.
  let blob = await new Promise((r) => canvas.toBlob(r, "image/webp", QUALITY));
  let type = "webp";
  if (!blob) {
    blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", QUALITY));
    type = "jpeg";
  }
  return blob ? { blob, type } : null;
}

// Resize + re-encode an image in the browser before upload. Returns a smaller
// File, or the original if compression isn't possible / wouldn't help.
// Non-images (e.g. video) are returned untouched so they upload as-is.
async function compressImage(file) {
  // Skip non-images and gifs (canvas would drop animation).
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // couldn't decode — send original
  }

  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const out = await canvasToBlob(canvas);
  // Keep the original if encoding failed or the result isn't actually smaller.
  if (!out || out.blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([out.blob], `${baseName}.${out.type === "webp" ? "webp" : "jpg"}`, {
    type: out.blob.type,
  });
}

// Upload an image/video to our own backend, which stores it on the server's
// local disk (public/uploads) and serves it from ${API}/uploads/... . Images
// are compressed in the browser first so the stored file stays small and the
// request stays well under any reverse-proxy body limit.
//
// `options.uploadPath` selects the backend endpoint:
//   - "/api/admin/upload" (default) — admin-only, any folder
//   - "/api/user/upload"            — logged-in users (reviews/avatars)
export async function uploadImageDirect(file, folder = "applebd/products", options = {}) {
  assertUploadSize(file);
  const { uploadPath = "/api/admin/upload" } = options;

  const optimized = await compressImage(file);

  const fd = new FormData();
  fd.append("file", optimized);
  fd.append("folder", folder);

  const resp = await fetch(`${API}${uploadPath}`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || "Upload failed");
  }

  // Backend returns { ok, asset: {...} }.
  const asset = data.asset || data;
  return {
    public_id: asset.public_id,
    url: asset.url,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    duration: asset.duration,
    resourceType: asset.resourceType,
  };
}

// Drop-in replacement for callers that expect the `{ asset }` shape the backend
// returns from POST /api/admin/upload.
export async function uploadAdminImage(file, folder = "applebd/products") {
  const asset = await uploadImageDirect(file, folder);
  return { asset };
}

// Upload for logged-in (non-admin) users — reviews and profile avatars. Folder
// is restricted server-side by the /api/user/upload endpoint.
export async function uploadUserImage(file, folder = "applebd/profiles") {
  return uploadImageDirect(file, folder, { uploadPath: "/api/user/upload" });
}
