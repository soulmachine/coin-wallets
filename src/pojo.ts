export const TOKEN_PROTOCOLS = ['EOS', 'ERC20', 'IRC20', 'NEP5', 'NRC20', 'OMNI', 'TRC20'] as const;

export type TokenProtocol = typeof TOKEN_PROTOCOLS[number];

export interface Address {
  symbol: string;
  address: string;
  memo?: string;
  protocol?: TokenProtocol;
  legacyAddress?: string; // for BCH
  cashAddress?: string; // for BCH
}

export interface PrivateKey extends Address {
  privateKey: string;
}

export const SYMBOLS_REQUIRE_MEMO = ['ATOM', 'EOS', 'XLM', 'XRP'];

export const SYMBOLS_REQUIRE_PROTOCOL = ['USDT'];
