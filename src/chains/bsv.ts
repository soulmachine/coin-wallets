// import * as bip39 from 'bip39';
import { strict as assert } from 'assert';
import Axios from 'axios';
import * as bip39 from 'bip39';
import bsv from 'bsv';
import { USER_CONFIG } from '../user_config';
import { calcDecimals } from '../utils';

const BSV_DECIMALS = 8;
const DUST_LIMIT = 546; // 546 Satoshi

// eslint-disable-next-line import/prefer-default-export
export function getAddressFromMnemonic(mnemonic: string): { address: string; privateKey: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  // const seed = Mnemonic.fromString(mnemonic).toSeed(); // TypeError: Cannot read property 'fromString' of undefined
  const hdPrivateKey = bsv.HDPrivateKey.fromSeed(seed, bsv.Networks.mainnet);

  const child = hdPrivateKey.deriveChild("m/44'/236'/0'/0/0");

  const address = child.publicKey.toAddress(bsv.Networks.mainnet);

  return { address: address.toString(), privateKey: child.privateKey.toWIF() };
}

export async function getBalance(address: string): Promise<number> {
  const response = await Axios.get(
    `https://api.whatsonchain.com/v1/bsv/main/address/${address}/balance`,
  );

  assert.equal(response.status, 200);
  return (response.data.confirmed + response.data.unconfirmed) / 10 ** BSV_DECIMALS;
}

// copied from https://github.com/bitcoincashjs/bchwallet1a/blob/master/part7/src/wallet.js
function estimateTransactionBytes(
  inputCount: number,
  outputCount: number,
  speed: 'Slow' | 'Average' | 'Fast' = 'Average',
): number {
  const feePerByteMap: { [key: string]: number } = {
    Slow: 1,
    Average: 10,
    Fast: 30,
  };
  const feePerByte = feePerByteMap[speed];

  return feePerByte * (inputCount * 149 + outputCount * 34 + 10);
}

export async function send(to: string, quantity: string): Promise<{ txid: string } | Error> {
  assert.ok(USER_CONFIG.MNEMONIC);

  if (calcDecimals(quantity) > BSV_DECIMALS) {
    return new Error(
      `The quantity ${quantity} precision is greater than BSV decimals ${BSV_DECIMALS}`,
    );
  }

  const quantitySat = parseFloat(quantity) * 10 ** BSV_DECIMALS;
  if (quantitySat < DUST_LIMIT) {
    return new Error(`Output quantity ${quantitySat} is below dust limit ${DUST_LIMIT} Satoshi`);
  }

  const address = getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);

  const utxoResponse = await Axios.get(
    `https://api.whatsonchain.com/v1/bsv/main/address/${address.address}/unspent`,
  ).catch((e: Error) => {
    return e;
  });
  if (utxoResponse instanceof Error) return utxoResponse;
  assert.ok(Array.isArray(utxoResponse.data));

  const utxos = utxoResponse.data as {
    height: number;
    tx_pos: number;
    tx_hash: string;
    value: number;
  }[];

  const utxosBsv: bsv.Transaction.UnspentOutput[] = [];

  utxos.forEach(utxo => {
    const utxoBsv = {
      address: new bsv.Address(address.address),
      txId: utxo.tx_hash,
      outputIndex: utxo.tx_pos,
      script: bsv.Script.fromAddress(new bsv.Address(address.address)),
      satoshis: utxo.value,
    } as bsv.Transaction.UnspentOutput;
    utxosBsv.push(utxoBsv);
  });

  const balance = utxos.reduce((acc, curr) => {
    return acc + curr.value;
  }, 0);

  const fee1 = estimateTransactionBytes(utxos.length, 1);
  const fee2 = estimateTransactionBytes(utxos.length, 2);

  if (balance - quantitySat < fee1) {
    throw new Error('Insufficient balance.');
  }

  let transaction = new bsv.Transaction().from(utxosBsv);
  if (balance - quantitySat - fee2 < DUST_LIMIT) {
    transaction = transaction.to(to, quantitySat);
  } else if (to === address.address) {
    // send to yourself
    transaction = transaction.to(address.address, balance - fee1);
  } else {
    transaction = transaction.to(to, quantitySat).to(address.address, balance - quantitySat - fee2);
  }
  const privateKey = bsv.PrivateKey.fromWIF(address.privateKey);
  transaction = transaction.sign(privateKey);
  // console.info(transaction.getFee());

  const rawTransaction = transaction.serialize();

  const response = await Axios.post('https://api.whatsonchain.com/v1/bsv/main/tx/raw', {
    txhex: rawTransaction,
  }).catch((e: Error) => {
    return e;
  });
  if (response instanceof Error) return response;
  console.info(response.data);

  return { txid: response.data as string };
}
