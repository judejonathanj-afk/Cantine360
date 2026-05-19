import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var __db: PrismaClient | undefined;
}

/** Supabase + driver `pg` : `sslmode=require` dans l’URL force une vérif TLS stricte et peut provoquer P1011 / cert chain errors ; on retire sslmode et on configure SSL au pool. */
function postgresUrlWithoutSslMode(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return connectionString
      .replace(/([?&])sslmode=[^&]*/gi, (_, sep: string) =>
        sep === "?" ? "?" : "",
      )
      .replace(/\?&/g, "?")
      .replace(/[?&]$/g, "");
  }
}

function pgPoolOptions(): ConstructorParameters<typeof Pool>[0] {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { connectionString: raw };

  const supabase = raw.includes(".supabase.co");
  const connectionString = supabase
    ? postgresUrlWithoutSslMode(raw)
    : raw;

  return {
    connectionString,
    ...(supabase ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg(new Pool(pgPoolOptions())),
  });
}

/** En dev : invalide le singleton si `prisma generate` a touché le client (évite PrismaClientValidationError sur de nouveaux champs tant que le serveur n’a pas redémarré). */
function prismaArtifactFingerprint(): string {
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  try {
    const root = process.cwd();
    const schema = path.join(root, "prisma/schema.prisma");
    const establishmentModel = path.join(
      root,
      "src/generated/prisma/models/Establishment.ts",
    );
    const s = fs.statSync(schema).mtimeMs;
    let m = 0;
    try {
      m = fs.statSync(establishmentModel).mtimeMs;
    } catch {
      /* client pas encore généré */
    }
    return `${s}:${m}`;
  } catch {
    return "unknown";
  }
}

let prismaSingleton: PrismaClient | undefined;
let cachedFingerprint: string | undefined;

function disposeClient(c: PrismaClient | undefined) {
  if (!c) return;
  try {
    void c.$disconnect();
  } catch {
    /* ignore */
  }
}

function getOrCreatePrismaClient(): PrismaClient {
  const fp = prismaArtifactFingerprint();
  if (prismaSingleton && cachedFingerprint === fp) {
    return prismaSingleton;
  }
  disposeClient(prismaSingleton);
  prismaSingleton = undefined;
  cachedFingerprint = fp;

  const client = createPrismaClient();
  if (typeof client.establishment?.findUnique !== "function") {
    throw new Error(
      "[db] Client Prisma incomplet (modèle Establishment absent). Lancez `npx prisma generate`, supprimez `.next`, puis redémarrez `npm run dev`.",
    );
  }
  if (process.env.NODE_ENV !== "production") {
    globalThis.__db = client;
  }
  prismaSingleton = client;
  return client;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const real = getOrCreatePrismaClient();
    const value = Reflect.get(real as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(real);
    }
    return value;
  },
});
