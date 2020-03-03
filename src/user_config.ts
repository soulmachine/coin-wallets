export interface UserConfig {
  DFUSE_API_KEY?: string;
  eosAccount?: string;
  MNEMONIC?: string;
}

// Should be initialized by init().
export const USER_CONFIG: UserConfig = {};
