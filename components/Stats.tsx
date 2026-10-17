import { CATEGORIES, won, type Expense } from "@/lib/expenses";

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="columns">
      {rows.map((r, i) => (
        <div className="col" key={i}>
          <div className="col-bar-wrap">
            <div className="col-bar" style={{ height: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="col-label">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Stats({ expenses, today }: { expenses: Expense[]; today: string }) {
  if (!today) return null;

  const monthKey = today.slice(0, 7);
  const [year, month] = today.split("-").map(Number);
  const thisMonth = expenses.filter((e) => e.date.startsWith(monthKey));
  const total = thisMonth.reduce((s, e) => s + e.amount, 0);

  const byCategory = CATEGORIES.map((c) => ({
    name: c,
    value: thisMonth.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: `${d.getMonth() + 1}월`,
      value: expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0),
    };
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const key = `${monthKey}-${String(i + 1).padStart(2, "0")}`;
    return {
      label: (i + 1) % 5 === 0 || i === 0 ? String(i + 1) : "",
      value: thisMonth.filter((e) => e.date === key).reduce((s, e) => s + e.amount, 0),
    };
  });

  return (
    <section className="stats">
      <div className="card">
        <h3>{month}월 카테고리별</h3>
        {byCategory.length === 0 ? (
          <p className="hint">이번 달 지출이 아직 없어요</p>
        ) : (
          byCategory.map((c) => {
            const pct = Math.round((c.value / total) * 100);
            return (
              <div className="cat-row" key={c.name}>
                <div className="cat-line">
                  <span>{c.name}</span>
                  <span>
                    {won(c.value)} · {pct}%
                  </span>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h3>최근 6개월</h3>
        <Bars rows={months} />
      </div>

      <div className="card">
        <h3>{month}월 일별</h3>
        <Bars rows={days} />
      </div>
    </section>
  );
}
