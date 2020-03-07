import { strict as assert } from 'assert';
import bs58 from 'bs58';
import { utils } from 'ethers';

// sort object keys and stringify.
export function stringifyOrder(obj: { [key: string]: any }): string {
  const allKeys: string[] = [];
  JSON.stringify(obj, (key, value) => {
    allKeys.push(key);
    return value;
  });
  allKeys.sort();
  return JSON.stringify(obj, allKeys, 2);
}

export function calcDecimals(amount: string): number {
  if (!amount.includes('.')) return 0;
  return amount.split(' ')[0].split('.')[1].length;
}

export function padDecimals(amount: string, decimals: number): string {
  if (!amount.includes('.')) return `${amount}.${'0'.repeat(decimals)}`;
  const realDecimals = amount.split(' ')[0].split('.')[1].length;
  assert.ok(realDecimals < decimals);
  return amount.padEnd(amount.length + decimals - realDecimals);
}

export function isETHAddress(address: string): boolean {
  try {
    utils.getAddress(address);
    return true;
  } catch (error) {
    return false;
  }
}

export function detectPlatformFromAddress(address: string): string | undefined {
  if (address.indexOf('bc1') === 0) return 'BTC';

  try {
    const hexString = bs58.decode(address).toString('hex');
    if (hexString.length === 50) {
      const prefixPlatformMap: { [key: string]: string } = {
        '00': 'OMNI',
        '05': 'OMNI',
        '1e': 'DOGE',
        '21': 'ELA',
        '24': 'GRS',
        '30': 'LTC',
        '38': 'PAI',
        '3c': 'KMD',
        '41': 'TRC20',
        '3a': 'QTUM',
        '17': 'NEP5',
        '49': 'WICC',
        '4c': 'DASH',
        '52': 'XZC',
        '7c': 'XRP',
      };
      const prefix = hexString.slice(0, 2);
      if (prefix in prefixPlatformMap) return prefixPlatformMap[prefix];
    } else if (hexString.length === 52) {
      const prefixPlatformMap: { [key: string]: string } = {
        '01': 'WAVES',
        '05': 'VSYS',
        '07': 'DCR',
        '09': 'HC',
        '1c': 'ZEC',
        '19': 'NRC20',
        '20': 'ZEN',
      };
      const prefix = hexString.slice(0, 2);
      if (prefix in prefixPlatformMap) return prefixPlatformMap[prefix];
    } else if (hexString.length === 54) {
      const prefixPlatformMap: { [key: string]: string } = {
        '06': 'XTZ',
        '9e': 'NULS',
      };
      const prefix = hexString.slice(0, 2);
      if (prefix in prefixPlatformMap) return prefixPlatformMap[prefix];

      if (hexString.indexOf('06') === 0) {
        return 'XTZ';
      }
    } else if (hexString.length === 58) {
      if (hexString.indexOf('08') === 0) {
        return 'NEW';
      }
    } else if (hexString.length === 60) {
      if (hexString.indexOf('01') === 0) {
        return 'XEM';
      }
    } else if (hexString.length === 140) {
      if (hexString.indexOf('02') === 0) {
        return 'XMR';
      }
    } else if (hexString.length === 144) {
      if (hexString.indexOf('2c') === 0) {
        return 'ETN';
      }
    } else if (hexString.length === 152) {
      if (hexString.indexOf('82') === 0) {
        return 'ADA';
      }
    }
  } catch (e) {
    // do nothing;
  }

  if (isETHAddress(address)) return 'ERC20';

  if (address.indexOf('cosmos') === 0) return 'ATOM';
  if (address.indexOf('bnb') === 0) return 'BEP2';
  if (address.indexOf('zil') === 0) return 'ZIL';
  if (address.indexOf('hx') === 0) return 'ICX';
  if (address.indexOf('bm') === 0) return 'BTM';
  if (address.indexOf('ACT') === 0) return 'ACT';
  if (address.indexOf('ckb') === 0) return 'CKB';
  if (address.indexOf('ak_') === 0) return 'AE';
  if (address.indexOf('nano_') === 0) return 'NANO';
  if (/^[0-9]{1,20}L$/.test(address)) return 'LSK';
  if (/^[0-9a-f]{76}$/.test(address)) return 'SC';

  // https://github.com/EOSIO/eos/issues/955
  if (/(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)/.test(address)) return 'EOS';

  return undefined;
}
