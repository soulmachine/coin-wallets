import { strict as assert } from 'assert';
import { getTokenInfo } from 'eos-token-info';
import { isValidPrivate } from 'eosjs-ecc';
import { getCurrencyBalance, transfer } from './chains/defuse_eos';
import { Address, SYMBOLS_REQUIRE_MEMO, SYMBOLS_REQUIRE_PROTOCOL } from './pojo';
import { UserConfig, USER_CONFIG } from './user_config';
import { calcDecimals } from './utils';

/**
 * Initialize.
 *
 * @param param0 UserConfig
 */
export function init({
  DFUSE_API_KEY = '',
  eosAccount = '',
  eosPrivateKey = '',
  ethPrivateKey = '',
}: UserConfig): void {
  if (eosAccount) {
    assert.ok(DFUSE_API_KEY);
    assert.ok(eosPrivateKey);
    USER_CONFIG.eosAccount = eosAccount;
    if (!isValidPrivate(eosPrivateKey)) throw Error(`Invalid EOS private key: ${eosPrivateKey}`);
    USER_CONFIG.eosPrivateKey = eosPrivateKey;
  }

  if (DFUSE_API_KEY) {
    USER_CONFIG.DFUSE_API_KEY = DFUSE_API_KEY;
  }

  if (ethPrivateKey) USER_CONFIG.ethPrivateKey = ethPrivateKey;
}

/**
 * Send tokens.
 *
 * @param to  The destination address
 * @param amount How many to send
 * @return The transaction object or Error
 */
export async function send(to: Address, quantity: string): Promise<{ [key: string]: any } | Error> {
  if (Number.isNaN(Number(quantity))) {
    return new Error(`${quantity} is not a number`);
  }
  if (parseFloat(quantity) <= 0) {
    return new Error(`The quantity ${quantity} is not greater than 0`);
  }
  if (SYMBOLS_REQUIRE_MEMO.includes(to.symbol) && !to.memo) {
    throw new Error(`memo is missing in ${JSON.stringify(to)}`);
  }
  if (SYMBOLS_REQUIRE_PROTOCOL.includes(to.symbol) && !to.protocol) {
    throw new Error(`protocol is missing in ${JSON.stringify(to)}`);
  }

  switch (to.symbol) {
    case 'EOS': {
      const tokenInfo = getTokenInfo(to.symbol);
      if (calcDecimals(quantity) !== tokenInfo.decimals) {
        return new Error(
          `The quantity ${quantity} precision doesn't match with EOS decimals ${tokenInfo.decimals}`,
        );
      }
      return transfer(
        USER_CONFIG.eosAccount!,
        USER_CONFIG.eosPrivateKey!,
        to.address,
        to.symbol,
        quantity,
        to.memo,
      );
    }
    default:
      throw new Error(`Unsupported symbol ${to.symbol}`);
  }
}

/**
 * Query balance.
 *
 * @param symbol The currency symbol
 * @returns The available balance, or Error
 */
export async function queryBalance(symbol: string): Promise<number> {
  switch (symbol) {
    case 'EOS':
      return getCurrencyBalance(USER_CONFIG.eosAccount!, symbol);
    default:
      throw new Error(`Unsupported symbol ${symbol}`);
  }
}
