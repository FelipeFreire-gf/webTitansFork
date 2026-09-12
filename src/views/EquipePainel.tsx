"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Megaphone, KanbanSquare, CalendarDays, ClipboardCheck, Eye, LogOut, Users2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import AdminMembros from "@/views/AdminMembros";
import AvisosPainel from "@/views/AvisosPainel";
import CalendarioPainel from "@/views/CalendarioPainel";
import PresencasPainel from "@/views/PresencasPainel";
import StatusSistema from "@/components/equipe/StatusSistema";
import { VisaoProvider, useVisao, type PapelVisualizacao } from "@/components/equipe/VisaoContext";

type PainelView = "avisos" | "calendario" | "presencas" | "tarefas" | "membros";

interface ProjetoResumo {
  id: string;
  nome: string;
}

const LABEL_VISUALIZACAO: Record<PapelVisualizacao, string> = {
  MESTRE: "Mestre",
  CAPITAO: "Capitão",
  MEMBRO_PROJETO: "Membro",
};

function EquipeHeader({
  nome,
  projetoNome,
}: {
  nome: string | null | undefined;
  projetoNome: string | null;
}) {
  const { podeAlternarVisao, visualizandoComo, setVisualizandoComo } = useVisao();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="Ícone Titans" className="h-9 w-9 rounded-lg" />
          <div>
            <p className="text-sm font-medium leading-snug sm:text-base">
              Bem-vindo{nome ? `, ${nome}` : ""}! À plataforma digital da{" "}
              <span className="bg-gradient-to-r from-titans-red to-titans-orange bg-clip-text font-semibold text-transparent">
                TITANS
              </span>
              !
            </p>
            {projetoNome && (
              <p className="text-xs text-muted-foreground">Projeto atual: {projetoNome}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {podeAlternarVisao && (
            <Select
              value={visualizandoComo ?? "MESTRE"}
              onValueChange={(v) =>
                setVisualizandoComo(v === "MESTRE" ? null : (v as PapelVisualizacao))
              }
            >
              <SelectTrigger className="h-9 w-[170px] text-xs">
                <Eye className="mr-1 h-3.5 w-3.5 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MESTRE">Ver como Mestre</SelectItem>
                <SelectItem value="CAPITAO">Ver como Capitão</SelectItem>
                <SelectItem value="MEMBRO_PROJETO">Ver como Membro</SelectItem>
              </SelectContent>
            </Select>
          )}
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair do Sistema
          </Button>
        </div>
      </div>

      {visualizandoComo && (
        <div className="border-t border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-700 dark:text-amber-300 sm:px-6 lg:px-8">
          Pré-visualizando o painel como <strong>{LABEL_VISUALIZACAO[visualizandoComo]}</strong> —
          sua sessão continua sendo Mestre, isso é só visual.
        </div>
      )}
    </header>
  );
}

function EquipePainelConteudo() {
  const { data: session } = useSession();
  const { isMestre } = useVisao();
  const [view, setView] = useState<PainelView>("avisos");
  const [projetos, setProjetos] = useState<ProjetoResumo[] | null>(null);
  const [projetoId, setProjetoId] = useState<string | null>(null);

  const projetoAtualNome = projetos?.find((p) => p.id === projetoId)?.nome ?? null;

  useEffect(() => {
    fetch("/api/projetos")
      .then((r) => r.json())
      .then((data: { projetos: ProjetoResumo[] }) => {
        setProjetos(data.projetos);
        setProjetoId((prev) => prev ?? data.projetos[0]?.id ?? null);
      })
      .catch(() => setProjetos([]));
  }, []);

  // Se a pré-visualização tirar o acesso à aba atual (ex.: "Membros" vendo como Capitão), volta pra uma aba visível.
  useEffect(() => {
    if (view === "membros" && !isMestre) setView("avisos");
  }, [view, isMestre]);

  const navItems = [
    { id: "avisos" as const, label: "Avisos Gerais", icon: Megaphone },
    { id: "calendario" as const, label: "Calendário", icon: CalendarDays },
    { id: "presencas" as const, label: "Presenças", icon: ClipboardCheck },
    { id: "tarefas" as const, label: "Quadro de Tarefas", icon: KanbanSquare },
    ...(isMestre
      ? [{ id: "membros" as const, label: "Gerenciar Membros", icon: Users2 }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EquipeHeader nome={session?.user?.name} projetoNome={projetoAtualNome} />

      <main className="container mx-auto flex flex-1 flex-col px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card/30 p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <nav className="flex gap-2 lg:flex-col">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setView(item.id)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-titans-red to-titans-orange text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="min-w-0">
              {view === "avisos" && <AvisosPainel />}

              {view === "calendario" && <CalendarioPainel />}

              {view === "presencas" && <PresencasPainel />}

              {view === "tarefas" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-2">
                    {(projetos ?? []).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProjetoId(p.id)}
                        className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          projetoId === p.id
                            ? "bg-gradient-to-r from-titans-red to-titans-orange text-white"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {p.nome}
                      </button>
                    ))}
                  </div>

                  {projetoId && <KanbanBoard key={projetoId} projetoId={projetoId} />}
                </div>
              )}

              {view === "membros" && isMestre && <AdminMembros />}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <StatusSistema />

          <p className="mt-4 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TITANS. Todos os direitos reservados.
          </p>
        </div>
      </main>
    </div>
  );
}

const EquipePainel = () => {
  return (
    <VisaoProvider>
      <EquipePainelConteudo />
    </VisaoProvider>
  );
};

export default EquipePainel;
