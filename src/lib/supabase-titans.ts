import { createClient } from "@supabase/supabase-js";

// Cliente do projeto Supabase da camada TITANS — SEPARADO do projeto legado da
// camada IMPRESSORA (src/lib/supabase.ts), que continua servindo o
// web-to-print/kiosk existentes. Usado pelas features novas que sobem arquivo
// direto pro Storage a partir do navegador (ex.: pedidos_3d / bucket
// arquivos-3d).
const url = process.env.NEXT_PUBLIC_SUPABASE_TITANS_URL as string;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_TITANS_PUBLISHABLE_KEY as string;

if (!url || !publishableKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_TITANS_URL e NEXT_PUBLIC_SUPABASE_TITANS_PUBLISHABLE_KEY precisam estar definidas no .env.local"
  );
}

export const supabaseTitans = createClient(url, publishableKey, {
  auth: { persistSession: false },
});
