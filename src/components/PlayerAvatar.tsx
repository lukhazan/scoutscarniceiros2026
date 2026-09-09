type Props = {
  src?: string | null;
  name: string;
  className?: string;
  fallback?: string;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PlayerAvatar({ src, name, className = "size-10", fallback }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={`Foto de ${name}`}
        loading="lazy"
        decoding="async"
        className={`shrink-0 bg-transparent object-contain ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`shrink-0 overflow-hidden rounded-full bg-secondary ${className} flex items-center justify-center font-display text-sm tabular text-muted-foreground`}
    >
      {fallback ?? initials(name) ?? "–"}
    </span>
  );
}
