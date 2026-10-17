"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("이메일 또는 비밀번호가 맞지 않아요");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else if (!data.session) setMessage("가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요");
    }
    setBusy(false);
  }

  return (
    <main className="app auth">
      <p className="brand">★ Heather 가계부</p>
      <h1 className="auth-title">{mode === "signin" ? "로그인" : "회원가입"}</h1>

      <form className="auth-form" onSubmit={submit}>
        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {message && <p className="error">{message}</p>}

        <button type="submit" className="submit" disabled={busy}>
          {busy ? "잠시만요..." : mode === "signin" ? "로그인" : "가입하기"}
        </button>
      </form>

      <button
        className="switch"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage("");
        }}
      >
        {mode === "signin" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
      </button>
    </main>
  );
}
