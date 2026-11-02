import { thumbnailUrl } from "@nexpress/core";
import type { MediaAssetDto } from "@nexpress/database";
import { FileAudio, FileText, FileVideo } from "lucide-react";

const ICON = { document: FileText, video: FileVideo, audio: FileAudio } as const;
const LABEL = { image: "Görsel", document: "Belge", video: "Video", audio: "Ses" } as const;
export const kindLabel = (k: MediaAssetDto["kind"]) => LABEL[k];

/** Görsel için küçük resim; belge/video/ses için tür simgesi (alt metin gerektirmeyen süs öğesi). */
export function MediaThumb({ asset, width = 320, className = "" }: { asset: Pick<MediaAssetDto, "kind" | "url" | "altText" | "filename" | "mimeType">; width?: 320 | 480; className?: string }) {
  if (asset.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumbnailUrl(asset.url, width)} alt={asset.altText} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  const Icon = ICON[asset.kind];
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-1 bg-[#F1F2F4] text-[#5F6570] dark:bg-[#1B1E25] dark:text-[#9CA3AF] ${className}`}>
      <Icon className="h-8 w-8" aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase">{asset.url.split(".").pop()}</span>
    </div>
  );
}
