import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      records: {
        orderBy: { visitDate: "desc" },
        take: 1,
      },
    },
  });
  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const patient = await prisma.patient.create({
    data: {
      name: body.name,
      kana: body.kana ?? null,
      phone: body.phone ?? null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
    },
  });
  return NextResponse.json(patient, { status: 201 });
}
