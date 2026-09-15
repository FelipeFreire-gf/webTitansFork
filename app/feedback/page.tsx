import { redirect } from "next/navigation";

// Rota antiga: feedback agora é uma aba dentro do painel de membro em /equipe
// (exige login — antes era pública/anônima sem conta).
export default function Page() {
  redirect("/equipe");
}
