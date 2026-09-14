import DefinirSenha from "@/views/DefinirSenha";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <DefinirSenha token={token ?? null} />;
}
