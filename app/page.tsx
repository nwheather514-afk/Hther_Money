"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["식비", "카페", "교통", "쇼핑", "구독", "기타"] as const;
type Category = (typeof CATEGORIES)[number];

type Expense = {
  id: string;
  amount: number;
  place: string;
  category: Category;
  date: string; // YYYY-MM-DD
  memo: string;
};

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

function localToday() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function dateLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const week = ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${week})`;
}

export default function Home() {
  const [today, setToday] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [place, setPlace] = useState("");
  const [category, setCategory] = useState<Category>("식비");
  const [date, setDate] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localToday();
    setToday(t);
    setDate(t);

    supabase
      .from("expenses")
      .select("id, amount, place, category, date, memo")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError("지출 목록을 불러오지 못했어요");
        else setExpenses(data as Expense[]);
      });
  }, []);

  const monthKey = today.slice(0, 7);
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(monthKey))
    .reduce((sum, e) => sum + e.amount, 0);

  const groups = Object.entries(
    expenses.reduce<Record<string, Expense[]>>((acc, e) => {
      (acc[e.date] ||= []).push(e);
      return acc;
    }, {}),
  ).sort(([a], [b]) => (a < b ? 1 : -1));

  const monthNumber = today ? Number(today.slice(5, 7)) : null;
  const canSubmit = Number(amount) > 0 && place.trim() !== "" && date !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError("");
    const { data, error } = await supabase
      .from("expenses")
      .insert({ amount: Number(amount), place: place.trim(), category, date, memo: memo.trim() })
      .select("id, amount, place, category, date, memo")
      .single();
    setSaving(false);
    if (error) {
      setError("저장하지 못했어요. 다시 시도해 주세요");
      return;
    }
    setExpenses((prev) => [data as Expense, ...prev]);
    setAmount("");
    setPlace("");
    setMemo("");
    setCategory("식비");
    setDate(today);
    setOpen(false);
  }

  return (
    <main className="app">
      <header className="top">
        <p className="brand">★ Heather 가계부</p>
        <p className="label">{monthNumber ? `${monthNumber}월에 쓴 돈` : "이번 달에 쓴 돈"}</p>
        <p className="total">{won(monthTotal)}</p>
      </header>

      {error && !open && <p className="error">{error}</p>}

      <section className="list">
        {groups.length === 0 ? (
          <div className="empty">
            <p>아직 입력한 지출이 없어요</p>
            <p className="hint">아래 버튼으로 첫 지출을 입력해 보세요</p>
          </div>
        ) : (
          groups.map(([d, items]) => (
            <div className="group" key={d}>
              <div className="group-head">
                <span>{dateLabel(d)}</span>
                <span>{won(items.reduce((s, i) => s + i.amount, 0))}</span>
              </div>
              <ul>
                {items.map((i) => (
                  <li key={i.id}>
                    <span className="chip">{i.category}</span>
                    <div className="info">
                      <p className="place">{i.place}</p>
                      {i.memo && <p className="memo">{i.memo}</p>}
                    </div>
                    <span className="amt">-{won(i.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <button className="fab" onClick={() => setOpen(true)}>
        + 지출 입력
      </button>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <div className="sheet-head">
              <h2>지출 입력</h2>
              <button type="button" className="close" onClick={() => setOpen(false)} aria-label="닫기">
                ✕
              </button>
            </div>

            <label>
              금액
              <input
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </label>

            <label>
              사용처
              <input
                type="text"
                placeholder="어디에서 썼나요?"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </label>

            <div className="field">
              카테고리
              <div className="cats">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={c === category ? "cat on" : "cat"}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <label>
              날짜
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>

            <label>
              메모
              <input
                type="text"
                placeholder="(선택)"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </label>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="submit" disabled={!canSubmit || saving}>
              {saving ? "저장 중..." : "추가하기"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
