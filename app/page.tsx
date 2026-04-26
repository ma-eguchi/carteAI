"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Patient = {
  id: string;
  name: string;
  kana: string | null;
  phone: string | null;
  createdAt: string;
  records: { visitDate: string; chiefComplaint: string | null }[];
};

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", kana: "", phone: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/patients");
    setPatients(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addPatient(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", kana: "", phone: "" });
    setShowForm(false);
    setLoading(false);
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">患者一覧</h1>
          <p className="text-sm text-stone-500 mt-1">{patients.length}名 登録済み</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-700 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-teal-800 active:scale-[0.98] transition shadow-sm hover:shadow"
        >
          + 新規患者
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addPatient}
          className="bg-white border border-stone-200 rounded-2xl p-6 mb-8 space-y-4 shadow-sm"
        >
          <h2 className="font-semibold text-base text-stone-900">新規患者登録</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1.5">氏名 <span className="text-red-500">*</span></label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:bg-white transition"
                placeholder="山田 花子"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1.5">フリガナ</label>
              <input
                value={form.kana}
                onChange={(e) => setForm({ ...form, kana: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:bg-white transition"
                placeholder="ヤマダ ハナコ"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-600 block mb-1.5">電話番号</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:bg-white transition"
                placeholder="090-0000-0000"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-full transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm bg-teal-700 text-white rounded-full hover:bg-teal-800 disabled:opacity-50 transition"
            >
              {loading ? "登録中..." : "登録する"}
            </button>
          </div>
        </form>
      )}

      {patients.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white border border-dashed border-stone-300 rounded-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center text-2xl">
            🌱
          </div>
          <p className="text-base font-medium text-stone-700 mb-1">最初の患者さんを登録しましょう</p>
          <p className="text-sm text-stone-500">右上の「新規患者」から始められます</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {patients.map((p) => (
            <li key={p.id}>
              <Link
                href={`/patients/${p.id}`}
                className="flex items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl px-5 py-4 hover:border-teal-400 hover:shadow-sm hover:-translate-y-px transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm"
                    aria-hidden
                  >
                    {p.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-stone-900 group-hover:text-teal-700 transition">{p.name}</div>
                    <div className="text-xs text-stone-400 mt-0.5 truncate">
                      {p.kana && <span className="mr-2">{p.kana}</span>}
                      {p.phone && <span>{p.phone}</span>}
                      {!p.kana && !p.phone && <span className="text-stone-300">未設定</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-stone-400 shrink-0">
                  {p.records[0] ? (
                    <>
                      <div className="font-medium text-stone-500">
                        {new Date(p.records[0].visitDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                      </div>
                      {p.records[0].chiefComplaint && (
                        <div className="text-stone-400 mt-0.5 truncate max-w-[180px]">
                          {p.records[0].chiefComplaint}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px]">未来院</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
