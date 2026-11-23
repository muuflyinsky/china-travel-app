"use client";
import { useEffect, useState } from "react";
import { ShieldAlert, Check } from "lucide-react";
import { EditSheet } from "./EditSheet";
import { ShowCard } from "./ShowCard";
import { Button, Note } from "./ui";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { useEarly } from "./useEarly";
import { fmt } from "@/lib/i18n";
import { allergyLinesZh } from "@/lib/allergens";
import { FREE, PASSES, TRIAL, type QuotaKind } from "@/lib/products";
import { buy, hasPasses, inApp, isTrial, products, refreshPass, restore, savedPass, trialStart, type StoreProduct } from "@/lib/passes";
import { holdReview } from "@/lib/review";
import { earlyDate } from "@/lib/early";
import { APP_STORE_URL } from "@/lib/site";

/**
 * Trip pass sheet, opened by showPaywall() when today's free uses run out, from Settings, or from
 * the free-trial line on Eat and Talk. It offers the free 3-day trial first while this Apple ID
 * hasn't taken it (DECISIONS D23), then the passes with their real price per day and saving.
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
  const [taken, setTaken] = useState(trialStart);
  const [web, setWeb] = useState(false);
  const canBuy = hasPasses();
  const early = useEarly();

  useEffect(() => { setWeb(!inApp()); refreshPass().then(() => { setPass(savedPass()); setTaken(trialStart()); }); }, []);
  useEffect(() => (kind !== null ? holdReview() : undefined), [kind]);
  useEffect(() => {
    const open = (e: Event) => { setKind((e as CustomEvent<QuotaKind | "none">).detail); setNote(null); setPass(savedPass()); setTaken(trialStart()); };
    window.addEventListener("ctg:paywall", open);
    return () => window.removeEventListener("ctg:paywall", open);
  }, []);
  useEffect(() => {
    if (kind === null || !canBuy || Array.isArray(items)) return;
    products([...PASSES.map((p) => p.id), TRIAL.id]).then((p) => setItems(p.some((x) => x.id !== TRIAL.id) ? p : "error"), () => setItems("error"));
  }, [kind, canBuy, items]);

  const until = (ends: number) => new Date(ends).toLocaleString(profile.lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const list = Array.isArray(items) ? items : [];
  const onTrial = isTrial(pass);
  // Offered only while the App Store has it and this Apple ID hasn't taken it (as far as we know:
  // taking it again is harmless, the server keeps the first start).
  const offerTrial = canBuy && !pass && taken === null && list.some((x) => x.id === TRIAL.id);

  async function purchase(id: string) {
    setBusy(id); setNote(null);
    const r = await buy(id);
    setBusy(null);
    setTaken(trialStart());
    if (r.status === "purchased" && r.pass) {
      setPass(r.pass);
      setNote({ tone: "info", text: fmt(isTrial(r.pass) ? t.trial.started : t.pass.thanks, { date: until(r.pass.ends) }) });
    }
    else if (r.status === "trialUsed") setNote({ tone: "warn", text: t.trial.used });
    else if (r.status === "unlinked") setNote({ tone: "warn", text: id === TRIAL.id ? t.trial.unlinked : t.pass.unlinked });
    else if (r.status === "pending") setNote({ tone: "info", text: t.pass.pending });
    else if (r.status !== "cancelled") setNote({ tone: "warn", text: t.pass.failed });
  }

  async function onRestore() {
    setBusy("restore"); setNote(null);
    const p = await restore();
    setBusy(null);
    setTaken(trialStart());
    if (p === "unreachable") setNote({ tone: "warn", text: t.pass.unreachable });
    else if (p) { setPass(p); setNote({ tone: "info", text: fmt(t.pass.thanks, { date: until(p.ends) }) }); }
    else setNote({ tone: "warn", text: t.pass.restoreNone });
  }

  const hasRestrictions = profile.allergens.length + profile.diets.length > 0;
  const money = (p: StoreProduct, v: number) => new Intl.NumberFormat(profile.lang, { style: "currency", currency: p.currency }).format(v);
  // Saving per day against the 1-day pass, from the App Store's own prices in this storefront;
  // rounded down so it never says more than the real saving (D23: no made-up "was" prices).
  const oneDay = list.find((x) => x.id === PASSES[0].id);
  const saving = (p: StoreProduct, days: number) => (oneDay && days > 1 && oneDay.price > 0 ? Math.floor((1 - p.price / days / oneDay.price) * 100) : 0);
  const cheapest = list.filter((x) => x.id !== TRIAL.id).sort((a, b) => a.price - b.price)[0];
  const title = kind === null ? "" : kind === "none" && offerTrial ? t.trial.title : t.pass.out[kind];

  return (
    <>
      <EditSheet open={kind !== null} title={title} onClose={() => setKind(null)}>
        {pass ? (
          <Note>{fmt(onTrial ? t.trial.active : t.pass.active, { date: until(pass.ends) })}</Note>
        ) : (
          <>
            {/* Only when opened from Settings: a 402 means the server no longer counts this phone as early. */}
            {early && kind === "none" && <Note>{fmt(t.early.sheet, { date: earlyDate(profile.lang) })}</Note>}
            {offerTrial ? (
              // App Review 3.1.1: before it starts, say what it includes, that it ends by itself,
              // that it costs nothing, and what using the app costs afterwards.
              <div className="space-y-3 rounded-card border border-cobalt bg-card p-4">
                <ul className="space-y-2 text-subhead">
                  {[t.trial.includes, t.trial.ends, fmt(t.trial.after, { menus: FREE.menu_photo.max, dishes: FREE.menu_text.max, lines: FREE.translate.max, price: cheapest?.displayPrice ?? "" })].map((line) => (
                    <li key={line} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden />{line}</li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => purchase(TRIAL.id)} disabled={busy !== null}>{busy === TRIAL.id ? "…" : t.trial.start}</Button>
                <p className="text-footnote text-muted">{t.trial.once}</p>
              </div>
            ) : (
              <p className="px-1 text-body">{t.pass.body}</p>
            )}
            {kind && kind !== "none" && kind !== "hotel" && <p className="px-1 text-subhead text-muted">{t.pass.resets}</p>}
          </>
        )}
        {hasRestrictions && (
          <button onClick={() => setCard(true)} className="flex min-h-touch items-center gap-2 px-1 text-headline text-danger">
            <ShieldAlert className="h-5 w-5" aria-hidden />{t.eat.showAllergyCard}
          </button>
        )}
        {/* Passes stay on offer during the trial; a pass bought then starts at once. */}
        {canBuy && (!pass || onTrial) && (
          <div className="space-y-3">
            {offerTrial && <p className="px-1 text-subhead font-semibold">{t.trial.orPass}</p>}
            {onTrial && <p className="px-1 text-subhead text-muted">{t.trial.passStarts}</p>}
            {items === "loading" && <p className="px-1 text-subhead text-muted">{t.pass.loading}</p>}
            {items === "error" && <Note tone="warn">{t.pass.unavailable}</Note>}
            {PASSES.map((p) => {
              const sp = list.find((x) => x.id === p.id);
              if (!sp) return null;
              const save = saving(sp, p.days);
              return (
                <button key={p.id} onClick={() => purchase(p.id)} disabled={busy !== null}
                  className={`flex min-h-control w-full items-center justify-between gap-3 rounded-card border bg-card px-4 py-3 text-left disabled:opacity-60 ${p.days === 7 ? "border-cobalt" : "border-line"}`}>
                  <span>
                    <span className="block text-headline">{p.days === 1 ? t.pass.day1 : fmt(t.pass.days, { n: p.days })}</span>
                    <span className="block text-footnote text-muted">
                      {p.days === 7 ? `${t.pass.popular} · ` : ""}{fmt(t.pass.perDay, { price: money(sp, sp.price / p.days) })}
                      {save > 0 && <> · <span className="font-semibold text-cobalt">{fmt(t.pass.save, { n: save })}</span></>}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-headline text-cobalt">{busy === p.id ? "…" : sp.displayPrice}</span>
                </button>
              );
            })}
            <p className="px-1 text-footnote text-muted">{t.pass.oneTime}</p>
          </div>
        )}
        {!pass && !canBuy && <Note>{t.pass.getApp}</Note>}
        {/* The website may point to the App Store; the app never does (DECISIONS D19). */}
        {!pass && !canBuy && web && <Button href={APP_STORE_URL} external variant="soft" className="web-only">{t.common.getApp}</Button>}
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
