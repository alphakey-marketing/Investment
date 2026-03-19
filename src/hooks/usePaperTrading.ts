import { useState, useCallback } from 'react';
import { PaperAccount, PaperPosition } from '../types/mode';
import { TradeRecord } from '../types/trade';

const STORAGE_KEY = 'kma_paper_account';
const DEFAULT_BALANCE = 10000;

function loadAccount(): PaperAccount {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : { balance: DEFAULT_BALANCE, initialBalance: DEFAULT_BALANCE, openPosition: null };
  } catch {
    return { balance: DEFAULT_BALANCE, initialBalance: DEFAULT_BALANCE, openPosition: null };
  }
}

function save(acc: PaperAccount) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(acc)); } catch {}
}

export function usePaperTrading(
  addRealTrade: (t: Omit<TradeRecord, 'id'>) => void
) {
  const [account, setAccount] = useState<PaperAccount>(loadAccount);

  const update = (acc: PaperAccount) => { setAccount(acc); save(acc); };

  const openPosition = useCallback((
    symbol: string,
    type: 'LONG' | 'SHORT',
    price: number,
    capitalUsed: number,
    sl: number,
    tp: number
  ) => {
    setAccount((prev) => {
      if (prev.openPosition) return prev; // already in trade
      if (capitalUsed > prev.balance) return prev; // not enough
      const quantity = capitalUsed / price;
      const pos: PaperPosition = {
        id: Date.now().toString(),
        symbol, type, entryPrice: price, quantity,
        capitalUsed, stopLoss: sl, takeProfit: tp,
        openTime: Math.floor(Date.now() / 1000),
      };
      const acc = { ...prev, balance: prev.balance - capitalUsed, openPosition: pos };
      save(acc);
      return acc;
    });
  }, []);

  const closePosition = useCallback((exitPrice: number) => {
    setAccount((prev) => {
      const pos = prev.openPosition;
      if (!pos) return prev;
      const rawPnl = pos.type === 'LONG'
        ? (exitPrice - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - exitPrice) * pos.quantity;
      const pnl = parseFloat(rawPnl.toFixed(2));
      const pnlPct = parseFloat(((pnl / pos.capitalUsed) * 100).toFixed(2));
      const returnCapital = pos.capitalUsed + pnl;

      // Also log to real trade journal
      addRealTrade({
        symbol: pos.symbol, type: pos.type,
        entryPrice: pos.entryPrice, exitPrice,
        stopLoss: pos.stopLoss, takeProfit: pos.takeProfit,
        capitalUsed: pos.capitalUsed, quantity: pos.quantity,
        result: pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BREAK_EVEN',
        pnl, pnlPct,
        openTime: pos.openTime,
        closeTime: Math.floor(Date.now() / 1000),
        notes: '🧸 模擬交易',
      });

      const acc = { ...prev, balance: prev.balance + returnCapital, openPosition: null };
      save(acc);
      return acc;
    });
  }, [addRealTrade]);

  const resetAccount = useCallback((newBalance = DEFAULT_BALANCE) => {
    const acc = { balance: newBalance, initialBalance: newBalance, openPosition: null };
    update(acc);
  }, []);

  const pnl = account.balance + (account.openPosition?.capitalUsed ?? 0) - account.initialBalance;
  const pnlPct = parseFloat(((pnl / account.initialBalance) * 100).toFixed(2));

  return { account, openPosition, closePosition, resetAccount, pnl, pnlPct };
}
