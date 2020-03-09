export interface UserConfig {
  DFUSE_API_KEY?: string;
  eosAccount?: string;
  MNEMONIC?: string;
  AMBERDATA_API_KEY?: string;
}

// Should be initialized by init().
export const USER_CONFIG: UserConfig = {};
