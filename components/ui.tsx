"use client";
// Layout primitives. One spacing system for every screen (tokens in globals.css):
// gutter 16px · section 24px between sections · stack 12px inside a section · card 16px padding ·
// 48px main buttons · 44px minimum touch target · radius 16px for cards, 12px for controls.
import NextLink from "next/link";
import { ChevronDown, ChevronRight, Info, TriangleAlert } from "lucide-react";

export function Section({ title, id, aside, children, className = "" }: { title?: React.ReactNode; id?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`mt-section scroll-mt-4 first:mt-2 ${className}`}>
      {(title || aside) && <SectionTitle aside={aside}>{title}</SectionTitle>}
      <div className="space-y-stack">{children}</div>
    </section>
  );
}

/** The one section-heading style: subhead, semibold, muted, with an optional trailing link. */
export function SectionTitle({ children, aside }: { children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex min-h-6 items-baseline justify-between gap-3 px-1">
      {children && <h2 className="text-subhead font-semibold text-muted">{children}</h2>}
      {aside}
    </div>
  );
}

export function Card({ children, className = "", tone = "plain" }: { children: React.ReactNode; className?: string; tone?: "plain" | "brand" | "soft" | "danger" }) {
  const tones = {
    plain: "border border-line bg-card",
    brand: "bg-cobalt text-white dark:text-[#12141c]",
    soft: "bg-cobalt-soft",
    danger: "border border-danger bg-card",
  };
  return <div className={`rounded-card p-card ${tones[tone]} ${className}`}>{children}</div>;
}

/** Grouped list (iOS inset style). */
export function Group({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">{children}</ul>;
}

export function Row({
  icon, title, sub, after, href, onClick, external, chevron,
}: {
  icon?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; after?: React.ReactNode;
  href?: string; onClick?: () => void; external?: boolean; chevron?: boolean;
}) {
  const body = (
    <>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-body">{title}</span>
        {sub && <span className="mt-0.5 block text-footnote text-muted">{sub}</span>}
      </span>
      {after}
      {(chevron ?? Boolean(href || onClick)) && <ChevronRight className="h-5 w-5 shrink-0 text-muted opacity-60" aria-hidden />}
    </>
  );
  const cls = "flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left";
  return (
    <li>
      {href ? (
        external ? <a href={href} target="_blank" rel="noopener" className={cls}>{body}</a> : <NextLink href={href} className={cls}>{body}</NextLink>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={cls}>{body}</button>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  );
}

type BtnProps = { children: React.ReactNode; variant?: "primary" | "soft" | "cta" | "ink" | "ghost" | "outline"; href?: string; external?: boolean; onClick?: () => void; disabled?: boolean; className?: string; type?: "button" | "submit"; ariaLabel?: string };
export function Button({ children, variant = "primary", href, external, onClick, disabled, className = "", type = "button", ariaLabel }: BtnProps) {
  const v = {
    primary: "bg-cobalt text-white dark:text-[#12141c]",
    soft: "bg-cobalt-soft text-cobalt",
    cta: "bg-cta text-cta-ink",
    ink: "bg-ink text-porcelain",
    ghost: "text-cobalt",
    outline: "border border-line bg-card text-ink",
  }[variant];
  const cls = `inline-flex min-h-control items-center justify-center gap-2 rounded-control px-4 text-headline disabled:bg-line disabled:text-muted ${v} ${className}`;
  if (href) return external ? <a href={href} target="_blank" rel="noopener" className={cls} aria-label={ariaLabel}>{children}</a> : <NextLink href={href} className={cls} aria-label={ariaLabel}>{children}</NextLink>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel}>{children}</button>;
}

/** Round 44px icon-only button. Always give it a label. */
export function IconButton({ children, label, onClick, tone = "soft", pressed, disabled, className = "" }: {
  children: React.ReactNode; label: string; onClick?: () => void; tone?: "soft" | "plain" | "danger"; pressed?: boolean; disabled?: boolean; className?: string;
}) {
  const t = { soft: "bg-cobalt-soft text-cobalt", plain: "text-cobalt", danger: "bg-danger text-white" }[tone];
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={pressed}
      className={`grid h-touch w-touch shrink-0 place-items-center rounded-full disabled:opacity-50 ${t} ${className}`}>
      {children}
    </button>
  );
}

export function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "danger" }) {
  const t = { info: "bg-cobalt-soft text-ink", warn: "bg-warn-soft text-warn", danger: "bg-danger-soft text-danger" }[tone];
  const Icon = tone === "info" ? Info : TriangleAlert;
  return (
    <p role={tone === "info" ? undefined : "alert"} className={`flex gap-2 rounded-control p-3 text-subhead ${t}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone === "info" ? "text-cobalt" : ""}`} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Secondary information folded behind one row: method notes, long explanations. */
export function Disclosure({ title, children, icon }: { title: React.ReactNode; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <details className="group rounded-card border border-line bg-card">
      <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-subhead font-semibold [&::-webkit-details-marker]:hidden">
        {icon}
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 px-4 pb-4 text-footnote text-muted">{children}</div>
    </details>
  );
}

/** No results: what happened, why, and things to do next. Never a dead end. */
export function EmptyState({ icon, title, body, children }: { icon: React.ReactNode; title: React.ReactNode; body?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-card p-card">
      <span className="grid h-11 w-11 place-items-center rounded-control bg-cobalt-soft text-cobalt">{icon}</span>
      <h3 className="mt-3 text-headline">{title}</h3>
      {body && <p className="mt-1 text-subhead text-muted">{body}</p>}
      {children && <div className="mt-4 space-y-2">{children}</div>}
    </div>
  );
}

/** Labelled input/select inside a grouped list. */
export function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="px-4 py-2.5">
      <label className="block">
        <span className="block text-footnote text-muted">{label}</span>
        <span className="mt-0.5 block [&>input]:w-full [&>input]:bg-transparent [&>input]:py-1 [&>input]:text-body [&>input]:outline-none [&>select]:w-full [&>select]:bg-transparent [&>select]:py-1 [&>select]:text-body [&>select]:outline-none [&>textarea]:w-full [&>textarea]:bg-transparent [&>textarea]:text-body [&>textarea]:outline-none">
          {children}
        </span>
      </label>
    </li>
  );
}

export function IconTile({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "danger" }) {
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-[10px] ${tone === "danger" ? "bg-danger-soft text-danger" : "bg-cobalt-soft text-cobalt"}`}>{children}</span>
  );
}

/** Segmented control (two to four options). */
export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: React.ReactNode }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="grid rounded-control bg-line/60 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={`min-h-10 truncate rounded-[9px] px-2 text-subhead font-semibold ${value === o.value ? "bg-card shadow-sm" : "text-muted"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
