"use client";
import { useRef, useState } from "react";
import { Preloader, Sheet } from "konsta/react";
import { BedDouble, Camera, EyeOff, Server } from "lucide-react";
import { Button, Group, Row, IconTile, Note } from "./ui";
import { ShowCard } from "./ShowCard";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { compressImage } from "@/lib/image";
import { track } from "@/lib/track";
import { apiHeaders } from "@/lib/device";
import { quotaHit } from "@/lib/passes";

/** "Back to my hotel": one photo of the booking, then a one-tap taxi card forever after. */
export function HotelCard({ bare, brief, lead = "师傅您好，请带我回酒店：", title }: {
  bare?: boolean;
  /** Title only in lists; the how-to line belongs where people add the hotel. */
  brief?: boolean;
  /** First line of the driver card; from the airport it's "take me to", not "back to". */
  lead?: string;
  /** Row title when a hotel is saved (default "Back to my hotel"). */
  title?: string;
} = {}) {
  const t = useT();
  const [p, set] = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<boolean | "unavailable">(false);
  const [card, setCard] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // The picked screenshot waits here until the traveller confirms: booking screenshots usually show
  // their name and booking number, and it goes to a third-party AI service (App Store 5.1.2,
  // DECISIONS D15: only this upload gets a notice). Asked every time; Cancel sends nothing.
  const [pending, setPending] = useState<{ data: string; mediaType: string; preview: string } | null>(null);
  const reset = () => { if (fileRef.current) fileRef.current.value = ""; };

  async function onFile(f?: File) {
    if (!f) return;
    setError(false);
    try { setPending(await compressImage(f)); } catch { setError(true); reset(); }
  }

  function cancel() { setPending(null); reset(); }

  async function send() {
    const img = pending;
    setPending(null);
    if (!img) return;
    setBusy(true); setError(false);
    try {
      const r = await fetch("/api/hotel", { method: "POST", headers: { "content-type": "application/json", ...apiHeaders() }, body: JSON.stringify({ image: img.data, mediaType: img.mediaType }) });
      if (await quotaHit(r)) return;
      const d = await r.json();
      if (!r.ok) throw new Error(r.status === 503 || r.status === 429 ? "unavailable" : "");
      set({ hotel: { name: d.name, address: d.address, nameEn: d.nameEn, location: d.location } });
      track("hotel_read", {});
    } catch (e) {
      setError((e as Error).message === "unavailable" ? "unavailable" : true);
    } finally {
      setBusy(false);
      reset();
    }
  }

  const input = <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />;
  // Own backdrop and a high layer, so it also shows over the Today driver sheet this card sits in.
  const confirm = (
    <>
      <div onClick={cancel} aria-hidden className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${pending ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <Sheet opened={Boolean(pending)} backdrop={false} className="pb-safe z-[61]! mx-auto max-w-[600px]" style={{ maxHeight: "92vh" }}>
        <div role="dialog" aria-modal="true" aria-labelledby="hotel-shot-title" className="flex max-h-[92vh] flex-col bg-card text-ink">
          <div className="mx-auto mt-2 mb-2 h-1.5 w-10 shrink-0 rounded-full bg-line" aria-hidden />
          <div className="min-h-0 flex-1 overflow-auto px-5 pt-2">
            <h2 id="hotel-shot-title" className="text-title">{t.hotel.shotTitle}</h2>
            {pending && <img src={pending.preview} alt="" className="mt-3 max-h-40 rounded-control border border-line object-contain" />}
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-cobalt-soft text-cobalt"><Server className="h-5 w-5" aria-hidden /></span>
                <span className="min-w-0 text-subhead text-muted">{t.hotel.shotBody}</span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-cobalt-soft text-cobalt"><EyeOff className="h-5 w-5" aria-hidden /></span>
                <span className="min-w-0 text-subhead text-muted">{t.hotel.shotTip}</span>
              </li>
            </ul>
          </div>
          <div className="shrink-0 px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-2">
              <Button onClick={send} className="w-full">{t.hotel.shotSend}</Button>
              <Button variant="soft" onClick={cancel} className="w-full">{t.hotel.shotCancel}</Button>
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
  const show = card && p.hotel && <ShowCard kind="hotel" lines={[lead, p.hotel.name, `地址：${p.hotel.address}`]} sub={p.hotel.nameEn} onClose={() => setCard(false)} />;
  const rows = p.hotel ? (
    <>
      <Row onClick={() => { setCard(true); track("hotel_card_shown", {}); }} icon={<IconTile><BedDouble className="h-5 w-5" aria-hidden /></IconTile>}
        title={title ?? t.hotel.back} sub={<span className="zh">{p.hotel.nameEn ? `${p.hotel.nameEn} · ` : ""}{p.hotel.name}</span>} />
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
        <li className="contents">{input}{show}{confirm}</li>
      </>
    );
  }
  return (
    <>
      {input}
      {confirm}
      <Group>{rows}</Group>
      {error && <Note tone="warn">{error === "unavailable" ? t.common.unavailable : t.hotel.error}</Note>}
      {show}
    </>
  );
}
