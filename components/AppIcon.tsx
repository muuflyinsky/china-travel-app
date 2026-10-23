import { APPS, appIconUrl, type AppId } from "@/lib/apps";

/** Real app icon (served and cached by /api/app-icon). Rounded like an iOS icon. */
export function AppIcon({ id, size = 40, className = "" }: { id: AppId; size?: number; className?: string }) {
  return (
    <img
      src={appIconUrl(id)}
      alt={`${APPS[id].name} icon`}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 border border-line object-cover ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.225 }}
    />
  );
}
