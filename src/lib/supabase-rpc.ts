/** Appel RPC générique : évite les frictions de typage sur les fonctions jsonb. */
export function callRpc(
  client: { rpc: unknown },
  fn: string,
  args: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null }> {
  return (
    client.rpc as (
      f: string,
      a: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  )(fn, args);
}
