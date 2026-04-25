import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function formatKarte(audioText: string): Promise<{
  karteText: string;
  summary: string;
  chiefComplaint: string;
  treatment: string;
}> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `あなたは整体院・鍼灸院向けのカルテ整形AIです。
音声文字起こしテキストから、整理された施術カルテを生成してください。
以下のJSON形式で返してください（他のテキストは不要）:
{
  "karteText": "整形されたカルテ全文（マークダウン可）",
  "summary": "次回来院時に表示する1〜3行のサマリー",
  "chiefComplaint": "主訴・お悩み",
  "treatment": "施術内容・対処"
}`,
      },
      {
        role: "user",
        content: audioText,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");
  return {
    karteText: result.karteText ?? audioText,
    summary: result.summary ?? "",
    chiefComplaint: result.chiefComplaint ?? "",
    treatment: result.treatment ?? "",
  };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;
  const patientId = formData.get("patientId") as string | null;
  const manualText = formData.get("manualText") as string | null;

  if (!patientId) {
    return NextResponse.json({ error: "patientId required" }, { status: 400 });
  }

  let audioText = "";

  if (audio) {
    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "ja",
    });
    audioText = transcription.text;
  } else if (manualText) {
    audioText = manualText;
  } else {
    return NextResponse.json({ error: "audio or manualText required" }, { status: 400 });
  }

  const formatted = await formatKarte(audioText);

  const record = await prisma.record.create({
    data: {
      patientId,
      audioText,
      karteText: formatted.karteText,
      summary: formatted.summary,
      chiefComplaint: formatted.chiefComplaint,
      treatment: formatted.treatment,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
