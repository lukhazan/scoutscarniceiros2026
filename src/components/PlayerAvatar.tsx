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
  const base = `shrink-0 overflow-hidden rounded-full bg-secondary object-cover ${className}`;

  if (src) {
    return <img src={src} alt={`Foto de ${name}`} className={base} />;
  }

  return (
    <span
      aria-hidden
      className={`${base} flex items-center justify-center font-display text-sm tabular text-muted-foreground`}
    >
      {fallback ?? initials(name) ?? "–"}
    </span>
  );
}
