"use client";
import { AppIcon } from "../AppIcon";
import { useT } from "../useT";
import { appStoreUrl, playStoreUrl, APPS } from "@/lib/apps";

const APP_LIST = ["alipay", "wechat", "amap", "didi", "tripcom", "rail12306"] as const;

/** The apps to install before flying, with store links. */
export function AppList() {
  const t = useT();
  const android = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  return (
    <ul className="divide-y divide-line">
      {APP_LIST.map((id) => {
        const app = APPS[id];
        return (
          <li key={id}>
            <a href={(android && playStoreUrl(id)) || appStoreUrl(id)} target="_blank" rel="noopener" className="flex min-h-14 items-center gap-3 py-2">
              <AppIcon id={id} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block text-body">{app.name}{"zh" in app && app.zh && <span className="zh text-muted"> {app.zh}</span>}</span>
                <span className="block text-footnote text-muted">{t.prepare.appsWhy[id]}</span>
              </span>
              <span className="shrink-0 text-subhead font-semibold text-cobalt">{t.common.getApp}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
