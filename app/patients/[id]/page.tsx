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
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← 患者一覧</Link>
      </div>

      {patient && (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{patient.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {patient.kana && <span className="mr-3">{patient.kana}</span>}
              {patient.phone && <span>{patient.phone}</span>}
            </p>
          </div>
          <div className="text-xs text-gray-400 text-right">
            <div>来院回数: {records.length}回</div>
          </div>
        </div>
      )}

      {/* 前回サマリー */}
      {lastRecord?.summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-semibold text-sm">📋 前回サマリー</span>
            <span className="text-xs text-blue-400">
              {new Date(lastRecord.visitDate).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <p className="text-sm text-blue-800 whitespace-pre-wrap">{lastRecord.summary}</p>
          {lastRecord.chiefComplaint && (
            <p className="text-xs text-blue-600 mt-2">
              主訴: {lastRecord.chiefComplaint}
            </p>
          )}
        </div>
      )}

      {/* 録音・入力エリア */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-semibold">今回の施術を記録</h2>
          <div className="ml-auto flex gap-1 text-xs">
            <button
              onClick={() => setMode("voice")}
              className={`px-3 py-1 rounded-full transition ${mode === "voice" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              🎙 音声
            </button>
            <button
              onClick={() => setMode("text")}
              className={`px-3 py-1 rounded-full transition ${mode === "text" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              ✏️ テキスト
            </button>
          </div>
        </div>

        {mode === "voice" ? (
          <div className="flex flex-col items-center gap-4 py-4">
            {!recording && !processing && (
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white text-3xl shadow-lg transition active:scale-95"
              >
                🎙
              </button>
            )}
            {recording && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                  <span className="text-white text-3xl">⏺</span>
                </div>
                <p className="text-sm text-red-600 font-medium">録音中...</p>
                <button
                  onClick={stopAndSubmit}
                  className="px-6 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700"
                >
                  録音停止・送信
                </button>
              </div>
            )}
            {processing && (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">AIがカルテを作成中...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={5}
              placeholder="施術内容を自由に入力してください。AIがカルテ形式に整形します。&#10;例：患者は腰痛と右肩こりを訴えていた。腰部に集中してほぐし、肩甲骨周りを中心にストレッチ施術。30分。次回は来週を予定。"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={submitText}
                disabled={processing || !manualText.trim()}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {processing ? "作成中..." : "カルテ作成"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 過去カルテ一覧 */}
      <div>
        <h2 className="font-semibold mb-3 text-gray-700">施術履歴 ({records.length}件)</h2>
        <div className="space-y-3">
          {records.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div>
                  <span className="font-medium text-sm">
                    {new Date(r.visitDate).toLocaleDateString("ja-JP", {
                      year: "numeric", month: "long", day: "numeric", weekday: "short",
                    })}
                  </span>
                  {r.chiefComplaint && (
                    <span className="text-xs text-gray-400 ml-3">{r.chiefComplaint}</span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{expandedId === r.id ? "▲" : "▼"}</span>
              </button>
              {expandedId === r.id && (
                <div className="px-5 pb-5 border-t border-gray-100 space-y-4">
                  {r.chiefComplaint && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">主訴</p>
                      <p className="text-sm">{r.chiefComplaint}</p>
                    </div>
                  )}
                  {r.treatment && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">施術内容</p>
                      <p className="text-sm">{r.treatment}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">カルテ</p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{r.karteText}</p>
                  </div>
                  {r.summary && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">サマリー（次回表示用）</p>
                      <p className="text-sm text-blue-700 bg-blue-50 rounded-lg p-3 whitespace-pre-wrap">{r.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">施術記録がありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
