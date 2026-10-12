import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatformSession } from "@/server/auth";
import { platformDbErrorResponse } from "@/server/platformDbErrors";
import { updatePlatformPin } from "@/server/platformPin";

const BodySchema = z.object({
  currentPin: z.string().min(1),
  newPin: z.string().min(1),
  confirmPin: z.string().min(1),
});

export async function PATCH(req: Request) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  if (parsed.data.newPin.replace(/\D/g, "") !== parsed.data.confirmPin.replace(/\D/g, "")) {
    return NextResponse.json(
      { error: "La confirmation ne correspond pas au nouveau code." },
      { status: 400 },
    );
  }

  try {
    const result = await updatePlatformPin(parsed.data.currentPin, parsed.data.newPin);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      pinSource: "database" as const,
      message: "Code plateforme mis à jour. Utilisez-le dès la prochaine connexion.",
    });
  } catch (e) {
    return platformDbErrorResponse(e, "[PATCH /api/platform/settings/pin]");
  }
}
