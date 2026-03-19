// ─── Futu / HKEX Symbol & Contract Types ───────────────────────────────────────────────
// Symbol format matches Futu OpenAPI codes.
// HK.03081 = Value Gold ETF (HKEX-listed physical gold ETF, HKD-priced)

export type FutuSymbol =
  | 'HK.03081';  // Value Gold ETF — physical gold backed, HKEX listed

// No Yahoo fallback for HK ETF — use FutuOpenD exclusively
export const FUTU_TO_YAHOO: Record<FutuSymbol, string | null> = {
  'HK.03081': null,
};

export interface ContractSpec {
  multiplier:   number;   // lot size or point value
  tickSize:     number;   // minimum price movement
  currency:     'HKD';
  marginEstHKD: number;   // 0 for ETFs (no margin requirement)
  isFutures:    boolean;
}

export const CONTRACT_SPECS: Record<FutuSymbol, ContractSpec> = {
  'HK.03081': {
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
