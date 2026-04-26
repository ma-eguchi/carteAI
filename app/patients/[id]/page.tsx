"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Record = {
  id: string;
  visitDate: string;
  audioText: string;
  karteText: string;
  summary: string | null;
  chiefComplaint: string | null;
  treatment: string | null;
  notes: string | null;
};

type Patient = {
  id: string;
  name: string;
  kana: string | null;
  phone: string | null;
};

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualText, setManualText] = useState("");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function loadData() {
    const [patRes, recRes] = await Promise.all([
      fetch(`/api/patients`),
      fetch(`/api/patients/${id}/records`),
    ]);
    const patients: Patient[] = await patRes.json();
    setPatient(patients.find((p) => p.id === id) ?? null);
    setRecords(await recRes.json());
  }

  useEffect(() => { loadData(); }, [id]);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  }

  async function stopAndSubmit() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.stop();
    mr.onstop = async () => {
      setRecording(false);
      setProcessing(true);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      fd.append("patientId", id);
      await fetch("/api/transcribe", { method: "POST", body: fd });
      setProcessing(false);
      loadData();
    };
  }

  async function submitText() {
    if (!manualText.trim()) return;
    setProcessing(true);
    const fd = new FormData();
    fd.append("manualText", manualText);
    fd.append("patientId", id);
    await fetch("/api/transcribe", { method: "POST", body: fd });
    setManualText("");
    setProcessing(false);
    loadData();
  }

  const lastRecord = records[0];

  return (
    <div>
      <div className="mb-5">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-teal-700 transition">
          <span>←</span> 患者一覧
        </Link>
      </div>

      {patient && (
        <div className="bg-white border border-stone-200 rounded-2xl px-6 py-5 mb-6 flex items-start justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xl"
              aria-hidden
            >
              {patient.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">{patient.name}</h1>
              <p className="text-sm text-stone-500 mt-0.5 truncate">
                {patient.kana && <span className="mr-3">{patient.kana}</span>}
                {patient.phone && <span>{patient.phone}</span>}
                {!patient.kana && !patient.phone && <span className="text-stone-300">未設定</span>}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-teal-700 leading-none">{records.length}</div>
            <div className="text-[11px] text-stone-500 mt-1">来院</div>
          </div>
        </div>
      )}

      {/* 前回サマリー */}
      {lastRecord?.summary && (
        <div className="relative bg-emerald-50/60 border border-emerald-200 rounded-2xl px-6 py-5 mb-6 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" aria-hidden />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-800 font-semibold text-sm">前回サマリー</span>
            <span className="text-xs text-emerald-600">
              {new Date(lastRecord.visitDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
          <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">{lastRecord.summary}</p>
          {lastRecord.chiefComplaint && (
            <p className="text-xs text-emerald-700 mt-3 pt-3 border-t border-emerald-200/70">
              <span className="font-medium">主訴:</span> {lastRecord.chiefComplaint}
            </p>
          )}
        </div>
      )}

      {/* 録音・入力エリア */}
      <div className="bg-white border border-stone-200 rounded-2xl px-6 py-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="font-semibold text-stone-900">今回の施術を記録</h2>
          <div className="ml-auto flex gap-1 p-1 bg-stone-100 rounded-full text-xs">
            <button
              onClick={() => setMode("voice")}
              className={`px-3 py-1.5 rounded-full transition font-medium ${mode === "voice" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              🎙 音声
            </button>
            <button
              onClick={() => setMode("text")}
              className={`px-3 py-1.5 rounded-full transition font-medium ${mode === "text" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              ✏️ テキスト
            </button>
          </div>
        </div>

        {mode === "voice" ? (
          <div className="flex flex-col items-center gap-4 py-6">
            {!recording && !processing && (
              <>
                <button
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-3xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition active:scale-95"
                  aria-label="録音開始"
                >
                  🎙
                </button>
                <p className="text-sm text-stone-500">タップして録音開始</p>
              </>
            )}
            {recording && (
              <div className="flex flex-col items-center gap-4">
                <div className="record-pulse w-24 h-24 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-3xl">⏺</span>
                </div>
                <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  録音中
                </p>
                <button
                  onClick={stopAndSubmit}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm rounded-full transition shadow-md"
                >
                  録音停止・送信
                </button>
              </div>
            )}
            {processing && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-stone-600">AIがカルテを作成中...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={6}
              placeholder="施術内容を自由に入力してください。AIがカルテ形式に整形します。&#10;&#10;例：腰痛と右肩こりの訴え。腰部に集中してほぐし、肩甲骨周りを中心にストレッチ。30分。次回は来週予定。"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 focus:bg-white resize-none transition leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={submitText}
                disabled={processing || !manualText.trim()}
                className="px-6 py-2.5 bg-teal-700 text-white text-sm rounded-full hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {processing ? "作成中..." : "カルテ作成"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 過去カルテ一覧 */}
      <div>
        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="font-semibold text-stone-900">施術履歴</h2>
          <span className="text-xs text-stone-500">{records.length}件</span>
        </div>
        <div className="space-y-2">
          {records.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <div
                key={r.id}
                className={`bg-white border rounded-2xl overflow-hidden transition ${isOpen ? "border-teal-300 shadow-sm" : "border-stone-200"}`}
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 hover:bg-stone-50/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-center shrink-0">
                      <div className="text-base font-bold text-stone-900 leading-none">
                        {new Date(r.visitDate).getDate()}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        {new Date(r.visitDate).toLocaleDateString("ja-JP", { year: "numeric", month: "short" })}
                      </div>
                    </div>
                    <div className="w-px h-8 bg-stone-200" />
                    <div className="min-w-0">
                      <div className="text-xs text-stone-500">
                        {new Date(r.visitDate).toLocaleDateString("ja-JP", { weekday: "short" })}曜日
                      </div>
                      {r.chiefComplaint && (
                        <div className="text-sm text-stone-700 mt-0.5 truncate">{r.chiefComplaint}</div>
                      )}
                    </div>
                  </div>
                  <span className={`text-stone-400 text-sm shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-stone-100 space-y-4">
                    {r.chiefComplaint && (
                      <div>
                        <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5">主訴</p>
                        <p className="text-sm text-stone-800">{r.chiefComplaint}</p>
                      </div>
                    )}
                    {r.treatment && (
                      <div>
                        <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5">施術内容</p>
                        <p className="text-sm text-stone-800">{r.treatment}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5">カルテ</p>
                      <p className="text-sm whitespace-pre-wrap bg-stone-50 rounded-xl p-4 leading-relaxed text-stone-800">{r.karteText}</p>
                    </div>
                    {r.summary && (
                      <div>
                        <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5">サマリー（次回表示用）</p>
                        <p className="text-sm text-emerald-900 bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 whitespace-pre-wrap leading-relaxed">{r.summary}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {records.length === 0 && (
            <div className="text-center py-12 px-6 bg-white border border-dashed border-stone-300 rounded-2xl">
              <p className="text-sm text-stone-500">まだ施術記録がありません</p>
              <p className="text-xs text-stone-400 mt-1">上のボタンから記録を始めましょう</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
