import { connection } from "next/server";
import { EXTENSION_TYPES, KEY_PATTERN, readUpload } from "@/server/storage";

/**
 * Serves uploaded media. Keys are server-generated and validated against a
 * strict pattern (no traversal). Responses are immutable-cached, typed from
 * the verified extension, and sandboxed with a restrictive CSP + nosniff.
 * Range requests are supported so video can seek (Safari requires it).
 */
export async function GET(request: Request, { params }: RouteContext<"/media/[...key]">) {
  await connection();
  const key = (await params).key.join("/");
  if (!KEY_PATTERN.test(key)) return new Response("Not found", { status: 404 });

  const file = await readUpload(key);
  if (!file) return new Response("Not found", { status: 404 });

  const ext = key.split(".").pop()!;
  const headers = new Headers({
    "Content-Type": EXTENSION_TYPES[ext],
    // Keys are content-unique and never reused: cache forever in browsers and the CDN.
    "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Accept-Ranges": "bytes",
  });

  const range = request.headers.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
  if (match) {
    const start = match[1] ? Number(match[1]) : Math.max(0, file.size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), file.size - 1) : file.size - 1;
    if (start > end || start >= file.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${file.size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(new Uint8Array(file.data.subarray(start, end + 1)), { status: 206, headers });
  }

  headers.set("Content-Length", String(file.size));
  return new Response(new Uint8Array(file.data), { status: 200, headers });
}
