import { strict as assert } from 'assert';
import * as BTC from './btc';

const bchaddr = require('bchaddrjs');
const bitcore = require('bitcore-lib-cash');

// eslint-disable-next-line import/prefer-default-export
export function getAddressFromMnemonic(
  mnemonic: string,
): { legacyAddress: string; cashAddress: string; privateKey: string } {
  const address = BTC.getAddressFromMnemonic(mnemonic, 'BCH');
  const cashAddress = bchaddr.toCashAddress(address.address);

  const privateKey = bitcore.PrivateKey.fromWIF(address.privateKey);
  assert.equal(cashAddress, privateKey.toAddress().toString());

  return { legacyAddress: address.address, cashAddress, privateKey: address.privateKey };
}
