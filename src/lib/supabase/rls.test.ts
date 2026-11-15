import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Nécessite le Supabase local actif (`supabase start`) : crée deux utilisateurs
// anonymes réels et vérifie l'isolation RLS entre eux. Ignoré si la stack
// locale n'est pas configurée (pas de NEXT_PUBLIC_SUPABASE_URL/ANON_KEY).
describe.skipIf(!supabaseUrl || !supabaseAnonKey)(
  "RLS: isolation entre utilisateurs",
  () => {
    async function signInAnonymously(): Promise<SupabaseClient> {
      const client = createClient(supabaseUrl!, supabaseAnonKey!);
      const { error } = await client.auth.signInAnonymously();
      if (error) throw error;
      return client;
    }

    it("un utilisateur B ne peut ni lire ni supprimer un document de l'utilisateur A", async () => {
      const clientA = await signInAnonymously();
      const clientB = await signInAnonymously();

      const userA = (await clientA.auth.getUser()).data.user;
      if (!userA) throw new Error("utilisateur A manquant");

      const { data: document, error: insertError } = await clientA
        .from("documents")
        .insert({
          user_id: userA.id,
          filename: "test.pdf",
          storage_path: `${userA.id}/test.pdf`,
          doc_type: "other",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      const { data: readByB, error: readError } = await clientB
        .from("documents")
        .select()
        .eq("id", document.id);
      expect(readError).toBeNull();
      expect(readByB).toEqual([]);

      const { error: deleteError, count } = await clientB
        .from("documents")
        .delete({ count: "exact" })
        .eq("id", document.id);
      expect(deleteError).toBeNull();
      expect(count).toBe(0);

      const { data: stillThere } = await clientA
        .from("documents")
        .select()
        .eq("id", document.id);
      expect(stillThere).toHaveLength(1);

      await clientA.from("documents").delete().eq("id", document.id);
    });
  },
);
