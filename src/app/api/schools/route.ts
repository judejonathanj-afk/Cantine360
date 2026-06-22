import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getSchoolsForAdmin } from "@/server/schoolsForAdmin";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schools = await getSchoolsForAdmin(db, session.establishmentId);
  return NextResponse.json({ schools });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const school = await db.school.create({
    data: {
      name: parsed.data.name,
      establishmentId: session.establishmentId,
    },
    select: { id: true, name: true, active: true },
  });

  return NextResponse.json({ school: { ...school, groupCount: 0 } }, { status: 201 });
}
