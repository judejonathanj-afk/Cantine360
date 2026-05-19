import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { serviceId } = await params;
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId: session.establishmentId },
    include: {
      metrics: {
        include: { group: true },
        orderBy: [{ group: { name: "asc" } }],
      },
    },
  });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ service });
}

