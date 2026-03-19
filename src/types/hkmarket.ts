// ─── HKEX ETF Market Data — Yahoo Finance ticker format ────────────────────────────────
// HK ETF tickers as used by Yahoo Finance (e.g. 3081.HK)

export type HKTicker =
  | '3081.HK';  // Value Gold ETF — physical gold backed, HKEX listed

export interface ContractSpec {
  multiplier:   number;   // lot size or point value
  tickSize:     number;   // minimum price movement
  currency:     'HKD';
  marginEstHKD: number;   // 0 for ETFs (no margin requirement)
  isFutures:    boolean;
}

export const CONTRACT_SPECS: Record<HKTicker, ContractSpec> = {
  '3081.HK': {
    multiplier:   100,    // 1 board lot = 100 units
    tickSize:     0.01,   // HKD cents
    currency:     'HKD',
    marginEstHKD: 0,      // ETF — no margin requirement
    isFutures:    false,
  },
};

// HK trading sessions (HKT = UTC+8)
export const HK_SESSIONS = {
  morningOpen:    { h: 9,  m: 30 },
  morningClose:   { h: 12, m: 0  },
  afternoonOpen:  { h: 13, m: 0  },
  afternoonClose: { h: 16, m: 0  },
};
