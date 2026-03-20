/**
 * usePaperTrading — paper trading state hook
 *
 * FUTURES P&L FIX:
 *   - quantity = floor(capital / marginEstHKD)  → number of contracts, not capital/price
 *   - closePosition P&L = (priceDiff) × multiplier × contracts
 *   - Falls back gracefully to stock formula when multiplier = 1
 */
import { useState, useMemo } from 'react';
import { PaperAccount, OpenPosition } from '../types/mode';
import { TradeRecord } from '../types/trade';
import { HKTicker, CONTRACT_SPECS } from '../types/hkmarket';

const STORAGE_KEY = 'paper_account_v2';

function loadAccount(): PaperAccount {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { balance: 500_000, initialBalance: 500_000, openPosition: null };
}

function saveAccount(acc: PaperAccount) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(acc));
}

export function usePaperTrading(addTrade: (t: Omit<TradeRecord, 'id'>) => void) {
  const [account, setAccount] = useState<PaperAccount>(loadAccount);

  const persist = (acc: PaperAccount) => { setAccount(acc); saveAccount(acc); };

  const openPosition = (
    symbol: string,
    type: 'LONG' | 'SHORT',
    price: number,
    capital: number,
    sl: number,
    tp: number
  ) => {
    if (account.openPosition) return;
    if (capital > account.balance) return;

    const spec   = CONTRACT_SPECS[symbol as HKTicker];
    const isFut  = spec?.isFutures ?? false;
    const mult   = spec?.multiplier ?? 1;
    const margin = spec?.marginEstHKD ?? 0;

    const quantity = isFut
      ? (margin > 0 ? Math.max(1, Math.floor(capital / margin)) : 1)
      : (price > 0 ? capital / price : 0);

    const pos: OpenPosition = {
      symbol, type, entryPrice: price, stopLoss: sl, takeProfit: tp,
      quantity, capitalUsed: capital,
      openTime: Math.floor(Date.now() / 1000),
    };
    persist({ ...account, balance: account.balance - capital, openPosition: pos });
  };

  const closePosition = (exitPrice: number) => {
    const pos = account.openPosition;
    if (!pos) return;

    const spec = CONTRACT_SPECS[pos.symbol as HKTicker];
    const mult = spec?.multiplier ?? 1;

    const pnl = pos.type === 'LONG'
      ? (exitPrice - pos.entryPrice) * mult * pos.quantity
      : (pos.entryPrice - exitPrice) * mult * pos.quantity;

    const newBalance = account.balance + pos.capitalUsed + pnl;
    const pnlPct     = pos.capitalUsed > 0
      ? parseFloat(((pnl / pos.capitalUsed) * 100).toFixed(2))
      : 0;

    addTrade({
      symbol:      pos.symbol,
      type:        pos.type,
      entryPrice:  pos.entryPrice,
      exitPrice,
      stopLoss:    pos.stopLoss,
      takeProfit:  pos.takeProfit,
      capitalUsed: pos.capitalUsed,
      quantity:    pos.quantity,
      multiplier:  mult,
      result:      pnl >= 0 ? 'WIN' : 'LOSS',
      pnl:         parseFloat(pnl.toFixed(2)),
      pnlPct,
      openTime:    pos.openTime,
      closeTime:   Math.floor(Date.now() / 1000),
      notes:       `[paper] Closed @ ${exitPrice}`,
    });
    persist({ ...account, balance: newBalance, openPosition: null });
  };

  const resetAccount = (newBalance = 500_000) => {
    persist({ balance: newBalance, initialBalance: newBalance, openPosition: null });
  };

  const pnl    = parseFloat((account.balance - account.initialBalance).toFixed(2));
  const pnlPct = parseFloat(((pnl / account.initialBalance) * 100).toFixed(2));
  const openPnl = useMemo(() => null, []);

  return { account, openPosition, closePosition, resetAccount, pnl, pnlPct, openPnl };
}
