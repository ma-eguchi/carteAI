import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const records = await prisma.record.findMany({
    where: { patientId: id },
    orderBy: { visitDate: "desc" },
  });
  return NextResponse.json(records);
}
