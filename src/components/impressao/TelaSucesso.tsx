import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BotaoOndeRetirar } from "@/components/impressao/BotaoOndeRetirar";
import { protocoloDoPedido } from "@/lib/protocolo";

type Props = {
  pedidoId: string;
  // A tela volta após um reload por alguns minutos (pedido-em-andamento.ts);
  // as duas saídas descartam o pedido guardado para não reabrir esta tela.
  onNovoPedido: () => void;
  onSair: () => void;
};

export function TelaSucesso({ pedidoId, onNovoPedido, onSair }: Props) {
  const protocolo = protocoloDoPedido(pedidoId);

  return (
    <Card>
      <CardContent className="p-8 text-center space-y-4">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">Pagamento confirmado!</h2>
        <p className="text-muted-foreground">
          Seu pedido entrou na fila de impressão. Guarde o protocolo abaixo
          para retirar a impressão na sede da TITANS.
        </p>
        <div className="bg-muted/30 rounded-lg py-3">
          <p className="text-xs text-muted-foreground">Protocolo</p>
          <p className="text-2xl font-mono font-bold tracking-widest">{protocolo}</p>
        </div>

        <BotaoOndeRetirar variante="destacado" className="mt-4" />

        <div className="flex flex-col sm:flex-row justify-center gap-2 mt-2">
          <Button onClick={onNovoPedido}>Fazer outro pedido</Button>
          <Button asChild variant="outline">
            <Link href="/" onClick={onSair}>
              Voltar ao início
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
