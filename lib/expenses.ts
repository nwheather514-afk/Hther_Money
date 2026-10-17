export const CATEGORIES = ["식비", "카페", "교통", "쇼핑", "구독", "기타"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Expense = {
  id: string;
  amount: number;
  place: string;
  category: Category;
  date: string; // YYYY-MM-DD
  memo: string;
};

export const won = (n: number) => n.toLocaleString("ko-KR") + "원";
