/**
 * usePaperTrading — paper trading state hook
 *
 * FIX #1: import OpenPosition (was PaperPosition) to match mode.ts
 * FIX #5: all paper trades tagged [paper] in notes for journal filter
 */
import { useState, useMemo } from 'react';
import { PaperAccount, OpenPosition } from '../types/mode';
import { TradeRecord } from '../types/trade';

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
    if (account.openPosition) return;     // one position at a time
    if (capital > account.balance) return;
    const quantity = price > 0 ? capital / price : 0;
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
    const pnl = pos.type === 'LONG'
      ? (exitPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - exitPrice) * pos.quantity;
    const newBalance = account.balance + pos.capitalUsed + pnl;
    const pnlPct     = parseFloat(((pnl / pos.capitalUsed) * 100).toFixed(2));
    addTrade({
      symbol:      pos.symbol,
      type:        pos.type,
      entryPrice:  pos.entryPrice,
      exitPrice,
      stopLoss:    pos.stopLoss,
      takeProfit:  pos.takeProfit,
      capitalUsed: pos.capitalUsed,
      quantity:    pos.quantity,
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
  const openPnl = useMemo(() => null, [account.openPosition]);

  return { account, openPosition, closePosition, resetAccount, pnl, pnlPct, openPnl };
}
