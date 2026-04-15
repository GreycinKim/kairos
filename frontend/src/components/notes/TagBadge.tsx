import clsx from "clsx";

export function TagBadge({ name, color }: { name: string; color?: string | null }) {
  return (
    <span
      className={clsx("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium")}
      style={
        color
          ? {
              backgroundColor: `${color}33`,
              color,
              border: `1px solid ${color}55`,
            }
          : {
              backgroundColor: "hsl(211 100% 50% / 0.1)",
              color: "hsl(211 100% 42%)",
              border: "1px solid hsl(211 100% 50% / 0.22)",
            }
      }
    >
      {name}
    </span>
  );
}
