// Solana USDT payment detection.
// - Single platform hot wallet
// - Each user gets a unique memo tag (e.g. "botik-<userId>-<nonce>")
// - We poll the hot wallet for incoming tx that include a memo matching the user.
// - Confirmations ≥ 1 is enough (USDT-SPL is finality-fast on Solana).
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type ConfirmedSignatureInfo,
} from '@solana/web3.js';
import { Env } from '@/libs/Env';
import { getAssociatedTokenAddress } from '@solana/spl-token';

// We avoid importing @solana/spl-token at the top level to keep server bundle slim;
// this dynamic import lives only in functions that need it.
async function loadSpl() {
  return import('@solana/spl-token');
}

const USDT_DECIMALS = 6; // USDT-SPL uses 6 decimals
const REQUIRED_AMOUNT_USD = 1; // $1

export function expectedMemo(userId: number, nonce?: string): string {
  return `${Env.BOTIK_PAYMENT_MEMO_PREFIX}u${userId}-${nonce ?? randomShort()}`;
}

function randomShort(): string {
  return Math.random().toString(36).slice(2, 10);
}

let _conn: Connection | null = null;
function conn(): Connection {
  if (!_conn) {
    _conn = new Connection(Env.SOLANA_RPC_URL, 'confirmed');
  }
  return _conn;
}

export function getHotWalletAddress(): string | null {
  return Env.BOTIK_SOLANA_HOT_WALLET || null;
}

export type IncomingPayment = {
  signature: string;
  amountUsd: number;
  memo: string;
  slot: number;
  blockTime: number | null;
};

/** Poll the hot wallet's USDT-ATA for incoming transfers in the last `sinceMs`. */
export async function pollIncomingUsdt(
  hotWalletPubkey: PublicKey,
  sinceMs: number,
  signal?: AbortSignal,
): Promise<IncomingPayment[]> {
  const c = conn();
  const spl = await loadSpl();
  const usdtMint = new PublicKey(Env.SOLANA_USDT_MINT);
  const ata = await getAssociatedTokenAddress(usdtMint, hotWalletPubkey);
  let sigs: ConfirmedSignatureInfo[] = [];
  try {
    sigs = await c.getSignaturesForAddress(ata, { limit: 50 }, 'confirmed');
  } catch {
    return [];
  }
  const out: IncomingPayment[] = [];
  for (const s of sigs) {
    if (s.blockTime && s.blockTime * 1000 < sinceMs) continue;
    if (!s.signature) continue;
    try {
      const tx = await c.getParsedTransaction(s.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
      if (!tx) continue;
      // 1) Find the transfer-in to our ATA
      const post = tx.meta?.postTokenBalances ?? [];
      const pre = tx.meta?.preTokenBalances ?? [];
      const our = post.find((b) => b.owner === hotWalletPubkey.toBase58());
      if (!our) continue;
      const preOur = pre.find(
        (b) =>
          b.owner === hotWalletPubkey.toBase58() && b.mint === Env.SOLANA_USDT_MINT,
      );
      const preAmt = preOur?.uiTokenAmount.uiAmount ?? 0;
      const postAmt = our.uiTokenAmount.uiAmount ?? 0;
      const delta = postAmt - preAmt;
      if (delta < REQUIRED_AMOUNT_USD) continue;
      // 2) Find the memo
      const memo = extractMemo(tx);
      if (!memo) continue;
      out.push({
        signature: s.signature,
        amountUsd: delta,
        memo,
        slot: s.slot,
        blockTime: s.blockTime ?? null,
      });
    } catch (err) {
      if (signal?.aborted) throw err;
      // skip tx we can't decode
      continue;
    }
  }
  return out;
}

function extractMemo(tx: { transaction: { message: { instructions: unknown[] } } }): string | null {
  const ixs = tx.transaction.message.instructions as Array<{ program?: string; parsed?: unknown }>;
  for (const ix of ixs) {
    if (ix.program === 'spl-memo' && typeof ix.parsed === 'string') {
      return (ix.parsed as string).trim();
    }
  }
  return null;
}

/** Quick RPC liveness check (no signing). */
export async function rpcOk(): Promise<boolean> {
  try {
    const v = await conn().getEpochInfo();
    return typeof v.absoluteSlot === 'number';
  } catch {
    return false;
  }
}

// Re-export the cluster URL for clients (read-only).
export const SOLANA_CLUSTER = clusterApiUrl('mainnet-beta');
export { USDT_DECIMALS, REQUIRED_AMOUNT_USD };
