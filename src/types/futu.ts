// ─── Futu / HKEX Symbol & Contract Types ───────────────────────────────────────────────
// Symbol format matches Futu OpenAPI codes.
// Yahoo Finance equivalents used as fallback when FutuOpenD is not running.
// FIX #4: removed stale TODO Sprint 2 comment — Sprint 2 is complete.

export type FutuSymbol =
  | 'HK.MHImain'   // Mini Hang Seng Index Futures (continuous front month)
  | 'HK.HSImain'   // Full Hang Seng Index Futures
  | 'HK.HHImain'   // H-Shares Index Futures (HSCEI)
  | 'HK.00005'     // HSBC Holdings
  | 'HK.00700'     // Tencent Holdings
  | 'HK.00941'     // China Mobile
  | 'HK.02318'     // Ping An Insurance
  | 'HK.09988';    // Alibaba HK

// Yahoo Finance ticker equivalents (fallback when Futu proxy is offline)
export const FUTU_TO_YAHOO: Record<FutuSymbol, string> = {
  'HK.MHImain': '^HSI',
  'HK.HSImain': '^HSI',
  'HK.HHImain': '^HSCE',
  'HK.00005':   '0005.HK',
  'HK.00700':   '0700.HK',
  'HK.00941':   '0941.HK',
  'HK.02318':   '2318.HK',
  'HK.09988':   '9988.HK',
};

export interface ContractSpec {
  multiplier:   number;   // HKD per index point
  tickSize:     number;   // minimum price movement
  currency:     'HKD';
  marginEstHKD: number;   // approximate initial margin per contract
  isFutures:    boolean;
}

export const CONTRACT_SPECS: Record<FutuSymbol, ContractSpec> = {
  'HK.MHImain': { multiplier: 10,  tickSize: 1,   currency: 'HKD', marginEstHKD: 22000,  isFutures: true  },
  'HK.HSImain': { multiplier: 50,  tickSize: 1,   currency: 'HKD', marginEstHKD: 110000, isFutures: true  },
  'HK.HHImain': { multiplier: 50,  tickSize: 1,   currency: 'HKD', marginEstHKD: 45000,  isFutures: true  },
  'HK.00005':   { multiplier: 1,   tickSize: 0.1, currency: 'HKD', marginEstHKD: 0,      isFutures: false },
  'HK.00700':   { multiplier: 1,   tickSize: 0.2, currency: 'HKD', marginEstHKD: 0,      isFutures: false },
  'HK.00941':   { multiplier: 1,   tickSize: 0.1, currency: 'HKD', marginEstHKD: 0,      isFutures: false },
  'HK.02318':   { multiplier: 1,   tickSize: 0.1, currency: 'HKD', marginEstHKD: 0,      isFutures: false },
  'HK.09988':   { multiplier: 1,   tickSize: 0.2, currency: 'HKD', marginEstHKD: 0,      isFutures: false },
};

// HK trading sessions (HKT = UTC+8)
export const HK_SESSIONS = {
  morningOpen:    { h: 9,  m: 15 },
  morningClose:   { h: 12, m: 0  },
  afternoonOpen:  { h: 13, m: 0  },
  afternoonClose: { h: 16, m: 30 },
  eveningOpen:    { h: 17, m: 15 },
  eveningClose:   { h: 3,  m: 0  },
};
