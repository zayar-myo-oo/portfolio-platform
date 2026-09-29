import Image from "next/image";
import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GeneratedCover } from "./generated-cover";

/** Image from the media library, filling its (aspect-ratio'd) parent. */
export function MediaImage({
  media,
  sizes,
  priority,
  className,
}: {
  media: MediaAsset;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={media.url}
      alt={media.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}

/** Project/experiment cover: real thumbnail when available, generated otherwise. */
export function Cover({
  media,
  seed,
  title,
  accent,
  label,
  sizes,
  priority,
  className,
  imageClassName,
}: {
  media: MediaAsset | null;
  seed: string;
  title: string;
  accent?: string | null;
  label?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-paper-sunken", className)}>
      {media && media.kind === "IMAGE" ? (
        <MediaImage media={media} sizes={sizes} priority={priority} className={imageClassName} />
      ) : (
        <div className={cn("absolute inset-0", imageClassName)}>
          <GeneratedCover seed={seed} title={title} accent={accent} label={label} />
        </div>
      )}
    </div>
  );
}
