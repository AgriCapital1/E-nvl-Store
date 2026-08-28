import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface Balances {
  pending: number;
  available: number;
  withdrawing: number;
  withdrawn: number;
}

export interface LedgerEntry {
  id: string;
  bucket: string;
  amount_fcfa: number;
  entry_type: string;
  description: string | null;
  created_at: string;
}

export interface WithdrawalRow {
  id: string;
  reference: string;
  payout_method_code: string;
  destination: string;
  amount_fcfa: number;
  fee_fcfa: number;
  net_amount_fcfa: number;
  status: string;
  failure_reason: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  reference: string;
  type: string;
  gross_amount_fcfa: number;
  commission_amount_fcfa: number;
  provider_fee_fcfa: number;
  net_amount_fcfa: number;
  status: string;
  occurred_at: string;
}

export interface PayoutMethod {
  code: string;
  name: string;
  kind: string;
  fee_percent: number;
  fee_fixed_fcfa: number;
  min_amount_fcfa: number;
  is_live: boolean;
}

export interface FinanceOverview {
  hasDeveloperProfile: boolean;
  developerName: string | null;
  planCode: string | null;
  commissionRate: number | null;
  balances: Balances;
  ledger: LedgerEntry[];
  withdrawals: WithdrawalRow[];
  transactions: TransactionRow[];
  payoutMethods: PayoutMethod[];
}

const EMPTY_BALANCES: Balances = { pending: 0, available: 0, withdrawing: 0, withdrawn: 0 };

/** Tableau de bord financier du développeur connecté (lecture serveur, RLS appliquée). */
export const getFinanceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FinanceOverview> => {
    const supabase = context.supabase;

    const { data: profile } = await supabase
      .from("developer_profiles")
      .select("id, display_name, plan_code")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { data: methods } = await supabase
      .from("payout_methods")
      .select("code, name, kind, fee_percent, fee_fixed_fcfa, min_amount_fcfa, is_live")
      .eq("is_active", true)
      .order("name");

    const payoutMethods = (methods ?? []) as PayoutMethod[];

    if (!profile) {
      return {
        hasDeveloperProfile: false,
        developerName: null,
        planCode: null,
        commissionRate: null,
        balances: EMPTY_BALANCES,
        ledger: [],
        withdrawals: [],
        transactions: [],
        payoutMethods,
      };
    }

    const [balancesRes, usageRes, ledgerRes, withdrawalsRes, transactionsRes] = await Promise.all([
      supabase.rpc("developer_balances", { _developer_id: profile.id }),
      supabase.rpc("developer_usage", { _developer_id: profile.id }),
      supabase
        .from("wallet_ledger")
        .select("id, bucket, amount_fcfa, entry_type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("withdrawals")
        .select(
          "id, reference, payout_method_code, destination, amount_fcfa, fee_fcfa, net_amount_fcfa, status, failure_reason, processed_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("transactions")
        .select(
          "id, reference, type, gross_amount_fcfa, commission_amount_fcfa, provider_fee_fcfa, net_amount_fcfa, status, occurred_at",
        )
        .order("occurred_at", { ascending: false })
        .limit(30),
    ]);

    const balanceRow = (balancesRes.data as Balances[] | null)?.[0];
    const usageRow = (usageRes.data as { commission_rate: number }[] | null)?.[0];

    return {
      hasDeveloperProfile: true,
      developerName: profile.display_name,
      planCode: profile.plan_code,
      commissionRate: usageRow?.commission_rate ?? null,
      balances: {
        pending: Number(balanceRow?.pending ?? 0),
        available: Number(balanceRow?.available ?? 0),
        withdrawing: Number(balanceRow?.withdrawing ?? 0),
        withdrawn: Number(balanceRow?.withdrawn ?? 0),
      },
      ledger: (ledgerRes.data ?? []) as LedgerEntry[],
      withdrawals: (withdrawalsRes.data ?? []) as WithdrawalRow[],
      transactions: (transactionsRes.data ?? []) as TransactionRow[],
      payoutMethods,
    };
  });

const withdrawalInput = z.object({
  amount: z.number().int().min(5000),
  payoutMethodCode: z.string().min(2).max(40),
  destination: z.string().min(4).max(80),
});

/** Schéma de validation runtime des résultats jsonb renvoyés par les RPC. */
const rpcResultSchema = z.object({
  ok: z.boolean(),
  code: z.string().optional(),
  reference: z.string().optional(),
  minimum: z.number().optional(),
  available: z.number().optional(),
});

export interface RpcResult {
  ok: boolean;
  code?: string | undefined;
  reference?: string | undefined;
  minimum?: number | undefined;
  available?: number | undefined;
}

/** Garantit que la valeur renvoyée au client est sérialisable et bien typée. */
function parseRpcResult(value: unknown, fallbackCode: string): RpcResult {
  const parsed = rpcResultSchema.safeParse(value);
  if (!parsed.success) {
    console.error("Réponse RPC inattendue", parsed.error.message);
    return { ok: false, code: fallbackCode };
  }
  return parsed.data;
}

/** Crée une demande de retrait (minimum 5 000 FCFA, contrôles côté base). */
export const createWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => withdrawalInput.parse(data))
  .handler(async ({ data, context }): Promise<RpcResult> => {
    const { data: result, error } = await context.supabase.rpc("request_withdrawal", {
      _amount: data.amount,
      _payout_method_code: data.payoutMethodCode,
      _destination: data.destination,
    });
    if (error) {
      console.error("request_withdrawal failed", error.message);
      return { ok: false, code: "REQUEST_FAILED" };
    }
    return parseRpcResult(result, "REQUEST_FAILED");
  });

/** Annule une demande de retrait encore en attente. */
export const cancelWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ withdrawalId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<RpcResult> => {
    const { data: result, error } = await (
      context.supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    )("cancel_withdrawal", { _withdrawal_id: data.withdrawalId });
    if (error) {
      console.error("cancel_withdrawal failed", error.message);
      return { ok: false, code: "CANCEL_FAILED" };
    }
    return parseRpcResult(result, "CANCEL_FAILED");
  });
