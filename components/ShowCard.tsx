"use client";

// Full-screen, large-type Chinese card to hand to a taxi driver, waiter or hotel staff.
export function ShowCard({ lines, sub, onClose }: { lines: string[]; sub?: string; onClose: () => void }) {
  const speak = () => {
    const u = new SpeechSynthesisUtterance(lines.join("。"));
    u.lang = "zh-CN";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  return (
    <div className="overlay" role="dialog">
      <div className="row spread">
        <span className="chip">请看 · Show this screen</span>
        <button className="btn sm" onClick={onClose}>✕ Close</button>
      </div>
      <div className="zh stack" style={{ marginTop: 28, flex: 1 }}>
        {lines.map((l, i) => (
          <div key={i} className="big">{l}</div>
        ))}
      </div>
      {sub && <p className="muted">{sub}</p>}
      <button className="btn primary block" onClick={speak}>🔊 Play aloud in Chinese</button>
    </div>
  );
}
