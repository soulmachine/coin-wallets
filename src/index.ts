import { strict as assert } from 'assert';
import { getTokenInfo } from 'eos-token-info';
import * as BCH from './chains/bch';
import * as BSV from './chains/bsv';
import * as BTC from './chains/btc';
import * as EOS from './chains/eos';
import * as ETH from './chains/eth';
import { Address, SYMBOLS_REQUIRE_MEMO, SYMBOLS_REQUIRE_PROTOCOL } from './pojo';
import { UserConfig, USER_CONFIG } from './user_config';
import { calcDecimals, padDecimals } from './utils';

/**
 * Initialize.
 *
 * @param param0 UserConfig
 */
export async function init({
  DFUSE_API_KEY = '',
  eosAccount = '',
  MNEMONIC = '',
  AMBERDATA_API_KEY = '',
}: UserConfig): Promise<void> {
  assert.ok(MNEMONIC, 'MNEMONIC is empty!');
  USER_CONFIG.MNEMONIC = MNEMONIC;

  if (DFUSE_API_KEY) {
    USER_CONFIG.DFUSE_API_KEY = DFUSE_API_KEY;

    const { publicKey } = EOS.getAddressFromMnemonic(MNEMONIC);
    const accounts = await EOS.getAccounts(publicKey);

    if (eosAccount) {
      assert.ok(
        accounts.includes(eosAccount),
        `Please register the publicKey ${publicKey} to your EOS account ${eosAccount}`,
      );

      USER_CONFIG.eosAccount = eosAccount;
    } else {
      [USER_CONFIG.eosAccount] = accounts;
    }
  }

  if (AMBERDATA_API_KEY) {
    USER_CONFIG.AMBERDATA_API_KEY = AMBERDATA_API_KEY;
  }
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
    case 'BSV':
      return BSV.send(to.address, quantity);
    case 'BTC':
      return BTC.send(to.address, quantity);
    case 'EOS': {
      const tokenInfo = getTokenInfo(to.symbol);
      const decimals = calcDecimals(quantity);
      if (decimals > tokenInfo.decimals) {
        return new Error(
          `The quantity ${quantity} precision is ${decimals}, which is greater than EOS decimals ${tokenInfo.decimals}`,
        );
      }
      if (decimals < tokenInfo.decimals) {
        // eslint-disable-next-line no-param-reassign
        quantity = padDecimals(quantity, tokenInfo.decimals);
      }
      const privateKey = EOS.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);
      return EOS.transfer(
        USER_CONFIG.eosAccount!,
        privateKey.privateKey,
        to.address,
        to.symbol,
        quantity,
        to.memo,
      );
    }
    case 'ETC':
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
export async function getBalance(symbol: string): Promise<number> {
  switch (symbol) {
    case 'BCH':
      return BCH.getBalance(BCH.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!).cashAddress);
    case 'BSV':
      return BSV.getBalance(BSV.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!).address);
    case 'BTC':
      return BTC.getBalance(BTC.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!).address);
    case 'EOS':
      return EOS.getCurrencyBalance(USER_CONFIG.eosAccount!, symbol);
    case 'ETC':
    case 'ETH':
      return ETH.getBalance(symbol, ETH.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!).address);
    default:
      throw new Error(`Unsupported symbol ${symbol}`);
  }
}
