import { strict as assert } from 'assert';
import Axios from 'axios';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import bitcore from 'bitcore-lib';
import { USER_CONFIG } from '../user_config';
import { calcDecimals } from '../utils';

const BTC_DECIMALS = 8;
const DUST_LIMIT = 546; // 546 Satoshi

// copied from https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/bip32.spec.ts#L7
function getAddress(node: any, network?: any): string {
  return bitcoin.payments.p2pkh({ pubkey: node.publicKey, network }).address!;
}

// eslint-disable-next-line import/prefer-default-export
export function getAddressFromMnemonic(
  mnemonic: string,
  symbol: 'BCH' | 'BSV' | 'BTC' = 'BTC',
): { address: string; privateKey: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const node = bitcoin.bip32.fromSeed(seed);

  const pathMap: { [key: string]: string } = {
    BCH: "m/44'/145'/0'/0/0",
    BSV: "m/44'/236'/0'/0/0",
    BTC: "m/44'/0'/0'/0/0",
  };
  const child1 = node.derivePath(pathMap[symbol]);

  const address = getAddress(child1);
  const privateKey = child1.toWIF();

  assert.equal(address, new bitcore.PrivateKey(privateKey).toAddress().toString());

  return { address, privateKey };
}

export async function queryBalance(): Promise<number> {
  assert.ok(USER_CONFIG.MNEMONIC);

  const address = getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);

  const response = await Axios.get(`https://insight.bitpay.com/api/addr/${address.address}`);

  assert.equal(response.status, 200);
  return response.data.balance + response.data.unconfirmedBalance;
}

// copied from https://github.com/bitcoincashjs/bchwallet1a/blob/master/part7/src/wallet.js
function estimateTransactionBytes(
  inputCount: number,
  outputCount: number,
  speed: 'Slow' | 'Average' | 'Fast' = 'Average',
): number {
  const feePerByteMap: { [key: string]: number } = {
    Slow: 1,
    Average: 15,
    Fast: 30,
  };
  const feePerByte = feePerByteMap[speed];

  return feePerByte * (inputCount * 149 + outputCount * 34 + 10);
}

export async function send(to: string, quantity: string): Promise<{ txid: string } | Error> {
  assert.ok(USER_CONFIG.MNEMONIC);

  if (calcDecimals(quantity) > BTC_DECIMALS) {
    return new Error(
      `The quantity ${quantity} precision is greater than BCH decimals ${BTC_DECIMALS}`,
    );
  }

  const quantitySat = parseFloat(quantity) * 10 ** BTC_DECIMALS;
  if (quantitySat < DUST_LIMIT) {
    return new Error(`Output quantity ${quantitySat} is below dust limit ${DUST_LIMIT} Satoshi`);
  }

  const address = getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);

  const utxoResponse = await Axios.get(
    `https://insight.bitpay.com/api/addr/${address.address}/utxo`,
  ).catch((e: Error) => {
    return e;
  });
  if (utxoResponse instanceof Error) return utxoResponse;

  const utxosRaw = utxoResponse.data as {
    address: string;
    txid: string;
    vout: number;
    scriptPubKey: string;
    amount: number;
    satoshis: number;
    height: number;
    confirmations: number;
  }[];

  const utxos: bitcore.Transaction.UnspentOutput[] = [];
  utxosRaw.forEach(utxoRaw => {
    const utxo = new bitcore.Transaction.UnspentOutput(utxoRaw);
    utxos.push(utxo);
  });

  const balance = utxos.reduce((acc, curr) => {
    return acc + curr.satoshis;
  }, 0);

  const fee1 = estimateTransactionBytes(utxos.length, 1);
  const fee2 = estimateTransactionBytes(utxos.length, 2);
  if (balance - quantitySat < fee1) {
    throw new Error('Insufficient balance.');
  }

  let transaction = new bitcore.Transaction().from(utxos);
  if (balance - quantitySat - fee2 < DUST_LIMIT) {
    transaction = transaction.to(to, quantitySat);
  } else if (to === address.address) {
    // send to yourself
    transaction = transaction.to(address.address, balance - fee1);
  } else {
    transaction = transaction.to(to, quantitySat).to(address.address, balance - quantitySat - fee2);
  }
  const privateKey = new bitcore.PrivateKey(address.privateKey);
  transaction = transaction.sign(privateKey);
  // console.info(transaction.getFee());

  const rawTransaction = transaction.serialize() as string;

  const response = await Axios.post('https://insight.bitpay.com/api/tx/send', {
    rawtx: rawTransaction,
  }).catch((e: Error) => {
    return e;
  });
  if (response instanceof Error) return response;

  return response.data as { txid: string };
}
