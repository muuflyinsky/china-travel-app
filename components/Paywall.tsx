"use client";
import { useEffect, useState } from "react";
import { ShieldAlert, Check } from "lucide-react";
import { EditSheet } from "./EditSheet";
import { ShowCard } from "./ShowCard";
import { Button, Note } from "./ui";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { allergyLinesZh } from "@/lib/allergens";
import { PASSES, type QuotaKind } from "@/lib/products";
import { buy, hasPasses, products, refreshPass, restore, savedPass, type StoreProduct } from "@/lib/passes";

/**
 * Trip pass sheet, opened by showPaywall() when today's free uses run out (or from Settings).
 * The allergy card is always one tap away here: running out of free uses never leaves someone
 * with an allergy without a way to tell the kitchen.
 */
export function Paywall() {
  const t = useT();
  const [profile] = useProfile();
  const [kind, setKind] = useState<QuotaKind | "none" | null>(null);
  const [items, setItems] = useState<StoreProduct[] | "loading" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "info" | "warn"; text: string } | null>(null);
  const [card, setCard] = useState(false);
  const [pass, setPass] = useState(savedPass);
  const canBuy = hasPasses();

  useEffect(() => { refreshPass().then(() => setPass(savedPass())); }, []);
  useEffect(() => {
    const open = (e: Event) => { setKind((e as CustomEvent<QuotaKind | "none">).detail); setNote(null); setPass(savedPass()); };
    window.addEventListener("ctg:paywall", open);
    return () => window.removeEventListener("ctg:paywall", open);
  }, []);
  useEffect(() => {
    if (kind === null || !canBuy || Array.isArray(items)) return;
    products(PASSES.map((p) => p.id)).then((p) => setItems(p.length ? p : "error"), () => setItems("error"));
  }, [kind, canBuy, items]);

  const until = (ends: number) => new Date(ends).toLocaleString(profile.lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  async function purchase(id: string) {
    setBusy(id); setNote(null);
    const r = await buy(id);
    setBusy(null);
    if (r.status === "purchased" && r.pass) { setPass(r.pass); setNote({ tone: "info", text: fmt(t.pass.thanks, { date: until(r.pass.ends) }) }); }
    else if (r.status === "pending") setNote({ tone: "info", text: t.pass.pending });
    else if (r.status !== "cancelled") setNote({ tone: "warn", text: t.pass.failed });
  }

  async function onRestore() {
    setBusy("restore"); setNote(null);
    const p = await restore();
    setBusy(null);
    if (p) { setPass(p); setNote({ tone: "info", text: fmt(t.pass.thanks, { date: until(p.ends) }) }); }
    else setNote({ tone: "warn", text: t.pass.restoreNone });
  }

  const hasRestrictions = profile.allergens.length + profile.diets.length > 0;
  const perDay = (p: StoreProduct, days: number) =>
    new Intl.NumberFormat(profile.lang, { style: "currency", currency: p.currency }).format(p.price / days);

  return (
    <>
      <EditSheet open={kind !== null} title={kind ? t.pass.out[kind] : ""} onClose={() => setKind(null)}>
        {pass ? (
          <Note>{fmt(t.pass.active, { date: until(pass.ends) })}</Note>
        ) : (
          <>
            <p className="px-1 text-body">{t.pass.body}</p>
            {kind && kind !== "none" && kind !== "hotel" && <p className="px-1 text-subhead text-muted">{t.pass.resets}</p>}
          </>
        )}
        {hasRestrictions && (
          <button onClick={() => setCard(true)} className="flex min-h-touch items-center gap-2 px-1 text-headline text-danger">
            <ShieldAlert className="h-5 w-5" aria-hidden />{t.eat.showAllergyCard}
          </button>
        )}
        {!pass && canBuy && (
          <div className="space-y-3">
            {items === "loading" && <p className="px-1 text-subhead text-muted">{t.pass.loading}</p>}
            {items === "error" && <Note tone="warn">{t.pass.unavailable}</Note>}
            {Array.isArray(items) && PASSES.map((p) => {
              const sp = items.find((x) => x.id === p.id);
              if (!sp) return null;
              return (
                <button key={p.id} onClick={() => purchase(p.id)} disabled={busy !== null}
                  className={`flex min-h-control w-full items-center justify-between gap-3 rounded-card border bg-card px-4 py-3 text-left disabled:opacity-60 ${p.days === 7 ? "border-cobalt" : "border-line"}`}>
                  <span>
                    <span className="block text-headline">{p.days === 1 ? t.pass.day1 : fmt(t.pass.days, { n: p.days })}</span>
                    <span className="block text-footnote text-muted">{p.days === 7 ? `${t.pass.popular} · ` : ""}{fmt(t.pass.perDay, { price: perDay(sp, p.days) })}</span>
                  </span>
                  <span className="text-headline text-cobalt">{busy === p.id ? "…" : sp.displayPrice}</span>
                </button>
              );
            })}
            <p className="px-1 text-footnote text-muted">{t.pass.oneTime}</p>
          </div>
        )}
        {!pass && !canBuy && <Note>{t.pass.getApp}</Note>}
        {note && <Note tone={note.tone}>{note.text}</Note>}
        {canBuy && (
          <Button variant="soft" onClick={onRestore} disabled={busy !== null}>
            {busy === "restore" ? "…" : <><Check className="h-4 w-4" aria-hidden />{t.pass.restore}</>}
          </Button>
        )}
      </EditSheet>
      {card && (() => {
        const { severe, rest } = allergyLinesZh(profile.allergens, profile.diets, profile.severe);
        return <ShowCard kind="allergy" lead={severe || undefined} lines={["您好！我有饮食限制，麻烦您帮忙确认，谢谢！"]} rest={rest}
          replies={[{ zh: "可以，没问题", mine: t.eat.replyOk }, { zh: "里面有您过敏的东西", mine: t.eat.replyContainsAny }]} onClose={() => setCard(false)} />;
      })()}
    </>
  );
}
