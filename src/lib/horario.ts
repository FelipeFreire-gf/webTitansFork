// Formata um timestamp ISO como "HH:MM" (pt-BR). Retorna "" para null/inválido,
// deixando o chamador decidir se omite o trecho. Compartilhado entre o kiosk e
// o acompanhamento do pedido em /impressao.
export function formatarHorario(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
