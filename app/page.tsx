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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">患者一覧</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + 新規患者登録
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addPatient}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4"
        >
          <h2 className="font-semibold text-base">新規患者登録</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">氏名 *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="山田 花子"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">フリガナ</label>
              <input
                value={form.kana}
                onChange={(e) => setForm({ ...form, kana: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ヤマダ ハナコ"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">電話番号</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="090-0000-0000"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "登録中..." : "登録する"}
            </button>
          </div>
        </form>
      )}

      {patients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm">患者がまだ登録されていません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {patients.map((p) => (
            <Link
              key={p.id}
              href={`/patients/${p.id}`}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-blue-400 hover:shadow-sm transition group"
            >
              <div>
                <div className="font-medium group-hover:text-blue-600">{p.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {p.kana && <span className="mr-3">{p.kana}</span>}
                  {p.phone && <span>{p.phone}</span>}
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                {p.records[0] ? (
                  <>
                    <div>最終来院: {new Date(p.records[0].visitDate).toLocaleDateString("ja-JP")}</div>
                    {p.records[0].chiefComplaint && (
                      <div className="text-gray-500 mt-0.5 truncate max-w-[200px]">
                        {p.records[0].chiefComplaint}
                      </div>
                    )}
                  </>
                ) : (
                  <div>来院記録なし</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
