import { useState } from "react";

/**
 * Remote hotel stock URLs (Unsplash) occasionally 404; Picsum seeds stay stable.
 * On load failure, show an emerald gradient tile instead of a broken image icon.
 */
export default function GuestAppImg({ src, alt = "", className = "", fallbackClassName = "" }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    const fb =
      fallbackClassName.trim() ||
      "bg-gradient-to-br from-emerald-900/75 via-stone-900 to-black";
    return <div className={`${fb} ${className}`} aria-hidden />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
