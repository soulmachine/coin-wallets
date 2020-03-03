import { strict as assert } from 'assert';
import { getTokenInfo } from 'eos-token-info';
import { isValidPrivate } from 'eosjs-ecc';
import * as BCH from './chains/bch';
import * as EOS from './chains/eos';
import * as ETH from './chains/eth';
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
  MNEMONIC = '',
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

  if (MNEMONIC) USER_CONFIG.MNEMONIC = MNEMONIC;
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
    case 'BCH':
      return BCH.send(to.address, quantity);
    case 'EOS': {
      const tokenInfo = getTokenInfo(to.symbol);
      if (calcDecimals(quantity) !== tokenInfo.decimals) {
        return new Error(
          `The quantity ${quantity} precision doesn't match with EOS decimals ${tokenInfo.decimals}`,
        );
      }
      return EOS.transfer(
        USER_CONFIG.eosAccount!,
        USER_CONFIG.eosPrivateKey!,
        to.address,
        to.symbol,
        quantity,
        to.memo,
      );
    }
    case 'ETH':
      return ETH.send(to.symbol, to.address, quantity);
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
    case 'BCH':
      return BCH.queryBalance();
    case 'EOS':
      return EOS.getCurrencyBalance(USER_CONFIG.eosAccount!, symbol);
    case 'ETH':
      return ETH.getTokenBalance('ETH');
    default:
      throw new Error(`Unsupported symbol ${symbol}`);
  }
}
