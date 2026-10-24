// Apps and services we point travellers to. Icons are fetched from the App Store at runtime by
// /api/app-icon/[id] (cached), with a brand-coloured monogram as the fallback.
export type AppInfo = {
  id: string;
  name: string;
  zh?: string;
  color: string; // brand colour for the monogram fallback
  mono: string; // 1–2 characters for the fallback tile
  /** App Store lookup: bundle id when known for sure, otherwise a search term + storefront. */
  ios?: { bundleId?: string; term?: string; country?: string };
  android?: string; // Google Play package name
  web?: string;
};

export const APPS = {
  alipay: { id: "alipay", name: "Alipay", zh: "支付宝", color: "#1677ff", mono: "支", ios: { bundleId: "com.alipay.iphoneclient", country: "cn" }, android: "com.eg.android.AlipayGphone" },
  wechat: { id: "wechat", name: "WeChat", zh: "微信", color: "#07c160", mono: "微", ios: { bundleId: "com.tencent.xin", country: "cn" }, android: "com.tencent.mm" },
  amap: { id: "amap", name: "Amap", zh: "高德地图", color: "#2f7bff", mono: "高", ios: { bundleId: "com.autonavi.amap", country: "cn" }, android: "com.autonavi.minimap" },
  didi: { id: "didi", name: "DiDi", zh: "滴滴出行", color: "#fc9153", mono: "Di", ios: { term: "DiDi Rider", country: "us" }, android: "com.sdu.didi.psnger" },
  tripcom: { id: "tripcom", name: "Trip.com", color: "#287dfa", mono: "T", ios: { term: "Trip.com travel", country: "us" }, android: "ctrip.english", web: "https://www.trip.com" },
  rail12306: { id: "rail12306", name: "Railway 12306", zh: "铁路12306", color: "#2b6cb0", mono: "12", ios: { term: "铁路12306", country: "cn" }, web: "https://www.12306.cn/en/" },
  fliggy: { id: "fliggy", name: "Fliggy", zh: "飞猪", color: "#ffc300", mono: "飞", ios: { term: "飞猪旅行", country: "cn" } },
  dianping: { id: "dianping", name: "Dianping", zh: "大众点评", color: "#ff6633", mono: "点", ios: { bundleId: "com.dianping.dpscope", country: "cn" }, android: "com.dianping.v1" },
  applemaps: { id: "applemaps", name: "Apple Maps", color: "#34c759", mono: "M", ios: { term: "Apple Maps", country: "us" } },
  airalo: { id: "airalo", name: "Airalo", color: "#1b1e3d", mono: "A", ios: { term: "Airalo eSIM", country: "us" }, web: "https://www.airalo.com" },
  holafly: { id: "holafly", name: "Holafly", color: "#e8467c", mono: "H", ios: { term: "Holafly eSIM", country: "us" }, web: "https://esim.holafly.com" },
  saily: { id: "saily", name: "Saily", color: "#121212", mono: "S", ios: { term: "Saily eSIM", country: "us" }, web: "https://saily.com" },
  nomad: { id: "nomad", name: "Nomad", color: "#ff6a3d", mono: "N", ios: { term: "Nomad eSIM travel data", country: "us" }, web: "https://www.getnomad.app" },
  klook: { id: "klook", name: "Klook", color: "#ff5b00", mono: "K", ios: { term: "Klook travel", country: "us" }, web: "https://www.klook.com" },
} satisfies Record<string, AppInfo>;

export type AppId = keyof typeof APPS;

export const appIconUrl = (id: AppId) => `/api/app-icon/${id}`;
export const appStoreUrl = (id: AppId) => `/api/app-icon/${id}?store=1`;
export const playStoreUrl = (id: AppId) => {
  const pkg = (APPS[id] as AppInfo).android;
  return pkg ? `https://play.google.com/store/apps/details?id=${pkg}` : undefined;
};
