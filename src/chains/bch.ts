import { strict as assert } from 'assert';
import Axios from 'axios';
import { USER_CONFIG } from '../user_config';
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

export async function queryBalance(): Promise<number> {
  assert.ok(USER_CONFIG.MNEMONIC);

  const address = getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);

  const response = await Axios.get(
    `https://rest.bitcoin.com/v2/address/details/${address.legacyAddress}`,
  );

  assert.equal(response.status, 200);
  return parseFloat(response.data.balance);
}
