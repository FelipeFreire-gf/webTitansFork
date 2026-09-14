import crypto from "node:crypto";
import { prisma } from "./prisma";
import { enviarEmail } from "./email";

const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function montarHtmlConvite(nome: string | null, link: string): string {
  const saudacao = nome ? `Olá, ${nome}!` : "Olá!";
  return `
    <p>${saudacao}</p>
    <p>Você foi cadastrado(a) na área de membros da Robotics Titans. Clique no link abaixo pra criar sua senha de acesso:</p>
    <p><a href="${link}">${link}</a></p>
    <p>Esse link expira em 7 dias.</p>
  `;
}

// Best-effort (mesma convenção de notificarEquipeSobreReimpressao): o membro
// já foi cadastrado mesmo que o e-mail falhe — o MESTRE pode reenviar o
// convite pelo painel. Gera um token de uso único (verification_tokens, o
// mesmo model padrão do Auth.js) e nunca lança — quem chama decide como
// reagir ao boolean devolvido (ver reenviar-convite/route.ts).
export async function enviarConviteDeSenha(email: string, nome: string | null): Promise<boolean> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VALIDADE_MS);

  // Remove convites antigos pendentes pro mesmo e-mail — só o link mais
  // recente deve funcionar.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl}/definir-senha?token=${token}`;

  const ok = await enviarEmail({
    to: email,
    subject: "Robotics Titans — defina sua senha",
    html: montarHtmlConvite(nome, link),
  });
  if (!ok) {
    console.error(`Falha ao enviar convite de senha para ${email}`);
  }
  return ok;
}
