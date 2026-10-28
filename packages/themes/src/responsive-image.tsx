import React from "react";
import { buildPictureSpec, parseMediaRef } from "@nexpress/core";

/** Medya kimliği -> odak noktası (%). Yalnızca 50/50 dışındakiler taşınır. */
export type MediaFocalMap = Record<string, { x: number; y: number }>;

export const DEFAULT_IMAGE_SIZES = "(min-width: 1024px) 960px, 100vw";

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Görüntü genişliği ipucu; tarayıcı srcset basamağını buna göre seçer. */
  sizes?: string;
  /** Sayfanın LCP görseli: hemen yüklenir, yüksek öncelik alır. */
  priority?: boolean;
  /** Yalnızca dış (boyutsuz) adresler için yedek boyut. Yerel medyada başvurudan gelir. */
  width?: number;
  height?: number;
  /** Kırpılan (object-cover) kutularda ana konunun kadrajda kalması için odak noktaları. */
  focal?: MediaFocalMap;
}

/**
 * Yerel medya (`/media/{id}?w=&h=`) için `<picture>` (AVIF → WebP → JPG/PNG, srcset, sizes,
 * özgün en-boy oranı = sıfır kayma). Dış adresler düz `<img>` olarak kalır. İstemci JS'i yoktur.
 */
export function ResponsiveImage({
  src,
  alt,
  title,
  className,
  style,
  sizes = DEFAULT_IMAGE_SIZES,
  priority = false,
  width,
  height,
  focal,
}: ResponsiveImageProps) {
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : undefined;
  const ref = parseMediaRef(src);
  const point = ref ? focal?.[ref.id] : undefined;
  const imgStyle = point ? { ...style, objectPosition: `${point.x}% ${point.y}%` } : style;

  if (!ref) {
    return (
      <img
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={className}
        style={imgStyle}
      />
    );
  }

  const spec = buildPictureSpec(ref);
  return (
    <picture>
      {spec.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes} />
      ))}
      <img
        src={spec.img.src}
        srcSet={spec.img.srcSet}
        sizes={sizes}
        width={spec.img.width}
        height={spec.img.height}
        alt={alt}
        title={title}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={className}
        style={imgStyle}
      />
    </picture>
  );
}
