import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { podeEditarColuna, mapColuna } from "@/lib/server/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ colunaId: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { colunaId } = await params;

  const body = (await req.json().catch(() => undefined)) as { nome?: unknown } | undefined;
  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  if (!nome) return Response.json({ error: "Informe um nome para a coluna" }, { status: 400 });

  const canEdit = await podeEditarColuna(
    { id: session.user.id, role: session.user.role },
    colunaId
  );
  if (canEdit === null) return Response.json({ error: "Coluna não encontrada" }, { status: 404 });
  if (!canEdit) return Response.json({ error: "Sem permissão" }, { status: 403 });

  const coluna = await prisma.coluna.update({ where: { id: colunaId }, data: { nome } });
  return Response.json(mapColuna(coluna));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ colunaId: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { colunaId } = await params;

  const canEdit = await podeEditarColuna(
    { id: session.user.id, role: session.user.role },
    colunaId
  );
  if (canEdit === null) return Response.json({ error: "Coluna não encontrada" }, { status: 404 });
  if (!canEdit) return Response.json({ error: "Sem permissão" }, { status: 403 });

  const { projetoId } = await prisma.coluna.findUniqueOrThrow({
    where: { id: colunaId },
    select: { projetoId: true },
  });
  const total = await prisma.coluna.count({ where: { projetoId } });
  if (total <= 1) {
    return Response.json(
      { error: "Não é possível excluir a última coluna do projeto" },
      { status: 400 }
    );
  }

  await prisma.coluna.delete({ where: { id: colunaId } });
  return Response.json({ ok: true });
}
