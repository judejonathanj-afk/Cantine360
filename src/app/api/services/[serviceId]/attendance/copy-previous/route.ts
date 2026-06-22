import { NextResponse } from "next/server";
import { getServerSession } from "@/server/auth";
import { copyPreviousDayPresentCounts } from "@/server/copyPreviousAttendance";
import { db } from "@/server/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serviceId } = await params;
  const result = await copyPreviousDayPresentCounts(db, session.establishmentId, serviceId);

  if (!result.ok) {
    if (result.reason === "NOT_FOUND") {
      return NextResponse.json({ error: "Service introuvable." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Aucun service précédent trouvé pour reprendre les présents." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    groupsUpdated: result.groupsUpdated,
    previousDate: result.previousDate,
  });
}
