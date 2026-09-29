import { AdminForm, Panel } from "@/components/admin/form-kit";
import { MediaLibrary } from "@/components/admin/media-library";
import { AdminHeader } from "@/components/admin/ui";
import { uploadMedia } from "@/server/actions/admin/media";
import { requireAdmin } from "@/server/auth/dal";
import { db } from "@/server/db";
import { mediaUrl } from "@/server/data/mappers";

// Admin pages depend on the session and always render fresh data; they may block.
export const instant = false;
export const metadata = { title: "Media" };

export default async function AdminMediaPage() {
  await requireAdmin();
  const rows = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { projectThumbnails: true, projectPreviewVideos: true, galleries: true, postCovers: true, experimentThumbnails: true, sitePortraits: true, siteOgImages: true },
      },
    },
  });

  return (
    <>
      <AdminHeader
        title="Media"
        description="Files are type-checked by their contents (PNG, JPEG, WebP, GIF, AVIF, MP4, WebM), renamed, and served from /media. SVG is refused for security."
      />
      <AdminForm action={uploadMedia} submitLabel="Upload">
        <Panel title="Upload" description="Up to 4 MB per file (serverless hosting limit) and 12 files at a time. Prefer WebP images and short MP4 clips.">
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Files</span>
            <input
              type="file"
              name="files"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm"
              className="rounded-md border border-dashed border-line-strong bg-paper p-4 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-ink-inverse"
            />
          </label>
        </Panel>
      </AdminForm>
      <div className="mt-10">
        <MediaLibrary
          items={rows.map((row) => ({
            id: row.id,
            url: mediaUrl(row.key),
            alt: row.alt,
            name: row.originalName,
            kind: row.kind,
            size: row.size,
            width: row.width,
            height: row.height,
            usage: Object.values(row._count).reduce((sum, count) => sum + count, 0),
          }))}
        />
      </div>
    </>
  );
}
