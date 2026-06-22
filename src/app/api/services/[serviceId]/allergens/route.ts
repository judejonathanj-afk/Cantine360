import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getServiceAllergenSummary } from "@/server/serviceAllergenSummary";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { serviceId } = await params;
  const summary = await getServiceAllergenSummary(db, session.establishmentId, serviceId);
  if (!summary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ summary });
}
