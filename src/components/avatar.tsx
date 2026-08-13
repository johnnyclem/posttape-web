import { cn } from "@/lib/utils";

export function Avatar({
  name,
  hue,
  size = "md",
  className,
}: {
  name: string;
  hue: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dims =
    size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-14 text-lg" : "size-9 text-xs";
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-fg",
        dims,
        className,
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 28% 28%), hsl(${(hue + 30) % 360} 22% 18%))`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 20% 50% / 0.25)`,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
