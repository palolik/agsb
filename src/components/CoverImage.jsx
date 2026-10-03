import { resolveImage, imageSrcSet } from "../lib/api";

// Image for cards and heroes. Renders a plain placeholder when there is no
// image (never <img src="">). Cards load lazily; pass `priority` for an
// above-the-fold hero so it loads eagerly at high priority (LCP).
// width/height give the browser the aspect ratio before the file arrives;
// the CSS classes still decide the rendered size.
export default function CoverImage({
  image,
  alt,
  className = "w-full h-full object-cover",
  placeholderClassName = "w-full h-full bg-base-300",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  width = 600,
  height = 400,
  priority = false,
}) {
  const src = resolveImage(image);
  if (!src) return <div className={placeholderClassName} aria-hidden="true" />;
  const srcSet = imageSrcSet(src);
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
