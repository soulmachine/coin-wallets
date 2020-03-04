import { strict as assert } from 'assert';
import Axios from 'axios';
import { USER_CONFIG } from '../user_config';
import { calcDecimals } from '../utils';
import * as BTC from './btc';

const bchaddr = require('bchaddrjs');
const bitcore = require('bitcore-lib-cash');

const BCH_DECIMALS = 8;
const DUST_LIMIT = 546; // 546 Satoshi

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

// copied from https://github.com/bitcoincashjs/bchwallet1a/blob/master/part7/src/wallet.js
function estimateTransactionBytes(inputCount: number, outputCount: number): number {
  return inputCount * 149 + outputCount * 34 + 10;
}

export async function send(to: string, quantity: string): Promise<{ txid: string } | Error> {
  assert.ok(USER_CONFIG.MNEMONIC);

  if (!bchaddr.isValidAddress(to)) {
    return new Error(`The destination address ${to} is invalid`);
  }
  if (calcDecimals(quantity) > BCH_DECIMALS) {
    return new Error(
      `The quantity ${quantity} precision is greater than BCH decimals ${BCH_DECIMALS}`,
    );
  }

  const quantitySat = parseFloat(quantity) * 10 ** BCH_DECIMALS;
  if (quantitySat < DUST_LIMIT) {
    return new Error(`Output quantity ${quantitySat} is below dust limit ${DUST_LIMIT} Satoshi`);
  }

  const address = getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);

  const utxoResponse = await Axios.get(
    `https://rest.bitcoin.com/v2/address/utxo/${address.legacyAddress}`,
  ).catch((e: Error) => {
    return e;
  });
  if (utxoResponse instanceof Error) return utxoResponse;

  const utxosData = utxoResponse.data as {
    utxos: {
      txid: string;
      vout: number;
      amount: number;
      satoshis: number;
      height: number;
      confirmations: number;
      script?: string;
    }[];
    legacyAddress: string;
    cashAddress: string;
    slpAddress: string;
    scriptPubKey: string;
    asm: string;
  };

  utxosData.utxos.forEach(x => {
    x.script = utxosData.scriptPubKey; // eslint-disable-line no-param-reassign
  });

  const balance = utxosData.utxos.reduce((acc, curr) => {
    return acc + curr.satoshis;
  }, 0);

  const fee1 = estimateTransactionBytes(utxosData.utxos.length, 1);
  const fee2 = estimateTransactionBytes(utxosData.utxos.length, 2);
  if (balance - quantitySat < fee1) {
    throw new Error('Insufficient balance.');
  }

  let transaction = new bitcore.Transaction().from(utxosData.utxos);
  if (balance - quantitySat - fee2 < DUST_LIMIT) {
    transaction = transaction.to(to, quantitySat);
  } else if (to === address.legacyAddress || to === address.cashAddress) {
    // send to yourself
    transaction = transaction.to(address.cashAddress, balance - fee1);
  } else {
    transaction = transaction
      .to(to, quantitySat)
      .to(address.cashAddress, balance - quantitySat - fee2);
  }
  const privateKey = bitcore.PrivateKey.fromWIF(address.privateKey);
  transaction = transaction.sign(privateKey);
  // console.info(transaction.getFee());

  const rawTransaction = transaction.checkedSerialize() as string;

  const response = await Axios.post(
    'https://rest.bitcoin.com/v2/rawtransactions/sendRawTransaction',
    {
      hexes: [rawTransaction],
    },
  ).catch((e: Error) => {
    return e;
  });
  if (response instanceof Error) return response;

  return { txid: response.data[0] as string };
}
