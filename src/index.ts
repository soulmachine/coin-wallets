import { strict as assert } from 'assert';
import { getTokenInfo } from 'eos-token-info';
import * as BCH from './chains/bch';
import * as BSV from './chains/bsv';
import * as BTC from './chains/btc';
import * as EOS from './chains/eos';
import * as ETH from './chains/eth';
import { SYMBOLS_REQUIRE_MEMO, SYMBOL_PROTOCOLS } from './pojo';
import { UserConfig, USER_CONFIG } from './user_config';
import { calcDecimals, detectPlatformFromAddress, padDecimals } from './utils';

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
 * @param symbol The currency symbol
 * @param address  The destination address
 * @param quantity How many to send
 * @param memo The, required by EOS, XRP, XMR, etc.
 * @return The transaction object or Error
 */
export async function send(
  symbol: string,
  address: string,
  quantity: string,
  memo?: string,
): Promise<{ [key: string]: any } | Error> {
  if (Number.isNaN(Number(quantity))) {
    return new Error(`${quantity} is not a number`);
  }
  if (parseFloat(quantity) <= 0) {
    return new Error(`The quantity ${quantity} is not greater than 0`);
  }
  if (SYMBOLS_REQUIRE_MEMO.includes(symbol) && !memo) {
    throw new Error(`memo is missing for symbol ${symbol}`);
  }

  let protocol: string | undefined;
  if (symbol in SYMBOL_PROTOCOLS) {
    protocol = detectPlatformFromAddress(address);
    if (protocol === undefined) {
      throw new Error(`Failed to detect protocol the ${symbol} address ${address}`);
    }
    if (!SYMBOL_PROTOCOLS[symbol].includes(protocol)) {
      throw new Error(`The protocol ${protocol} of ${symbol} is not supported yet`);
    }
  }

  switch (symbol) {
    case 'BCH':
      return BCH.send(address, quantity);
    case 'BSV':
      return BSV.send(address, quantity);
    case 'BTC':
      return BTC.send(address, quantity);
    case 'EOS': {
      const tokenInfo = getTokenInfo(symbol);
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
        address,
        symbol,
        quantity,
        memo,
      );
    }
    case 'ETC':
    case 'ETH':
      return ETH.send(symbol as 'ETH' | 'ETC', address, quantity);
    case 'USDT': {
      assert.ok(protocol);
      switch (protocol!) {
        case 'ERC20':
          return ETH.sendERC20Token('USDT', address, quantity);
        default:
          throw new Error(`USDT ${protocol!} not supported yet`);
      }
    }
    default:
      throw new Error(`Unsupported symbol ${symbol}`);
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
    case 'USDT': {
      // TODO: balance = OMNI+ERC20+TRC20
      return ETH.getERC20TokenBalance(
        'USDT',
        ETH.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!).address,
      );
    }
    default:
      throw new Error(`Unsupported symbol ${symbol}`);
  }
}
