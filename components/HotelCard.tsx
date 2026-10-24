"use client";
import { useRef, useState } from "react";
import { Preloader } from "konsta/react";
import { BedDouble, Camera } from "lucide-react";
import { Group, Row, IconTile, Note } from "./ui";
import { ShowCard } from "./ShowCard";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { compressImage } from "@/lib/image";
import { track } from "@/lib/track";

/** "Back to my hotel": one photo of the booking, then a one-tap taxi card forever after. */
export function HotelCard({ bare, brief }: {
  bare?: boolean;
  /** Title only in lists; the how-to line belongs where people add the hotel. */
  brief?: boolean;
} = {}) {
  const t = useT();
  const [p, set] = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<boolean | "unavailable">(false);
  const [card, setCard] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true); setError(false);
    try {
      const img = await compressImage(f);
      const r = await fetch("/api/hotel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image: img.data, mediaType: img.mediaType }) });
      const d = await r.json();
      if (!r.ok) throw new Error(r.status === 503 ? "unavailable" : "");
      set({ hotel: { name: d.name, address: d.address, nameEn: d.nameEn, location: d.location } });
    } catch (e) {
      setError((e as Error).message === "unavailable" ? "unavailable" : true);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const input = <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />;
  const show = card && p.hotel && <ShowCard kind="hotel" lines={["师傅您好，请带我回酒店：", p.hotel.name, `地址：${p.hotel.address}`]} sub={p.hotel.nameEn} onClose={() => setCard(false)} />;
  const rows = p.hotel ? (
    <>
      <Row onClick={() => { setCard(true); track("hotel_card_shown", {}); }} icon={<IconTile><BedDouble className="h-5 w-5" aria-hidden /></IconTile>}
        title={t.hotel.back} sub={<span className="zh">{p.hotel.nameEn ? `${p.hotel.nameEn} · ` : ""}{p.hotel.name}</span>} />
      <Row onClick={() => fileRef.current?.click()} icon={<Camera className="h-5 w-5 text-muted" aria-hidden />} title={<span className="text-subhead text-cobalt">{t.hotel.change}</span>} chevron={false} />
    </>
  ) : (
    <Row onClick={() => fileRef.current?.click()} icon={<IconTile>{busy ? <Preloader className="h-5! w-5!" /> : <BedDouble className="h-5 w-5" aria-hidden />}</IconTile>}
      title={busy ? t.hotel.reading : t.hotel.add} sub={brief ? undefined : t.hotel.addSub} />
  );

  // `bare` renders list items only, for use inside another grouped list.
  if (bare) {
    return (
      <>
        {rows}
        {error && <li className="px-4 pb-3"><Note tone="warn">{error === "unavailable" ? t.common.unavailable : t.hotel.error}</Note></li>}
        <li className="contents">{input}{show}</li>
      </>
    );
  }
  return (
    <>
      {input}
      <Group>{rows}</Group>
      {error && <Note tone="warn">{error === "unavailable" ? t.common.unavailable : t.hotel.error}</Note>}
      {show}
    </>
  );
}
