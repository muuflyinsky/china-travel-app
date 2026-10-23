export function DemoBadge({ show, what }: { show?: boolean; what: string }) {
  if (!show) return null;
  return <div className="banner warn">Demo data — add {what} to <code>.env.local</code> for live results.</div>;
}
