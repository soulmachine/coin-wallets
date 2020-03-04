// import * as bip39 from 'bip39';
import { strict as assert } from 'assert';
import Axios from 'axios';
import * as bip39 from 'bip39';
import bsv from 'bsv';
import { USER_CONFIG } from '../user_config';

const BSV_DECIMALS = 8;

// eslint-disable-next-line import/prefer-default-export
export function getAddressFromMnemonic(mnemonic: string): { address: string; privateKey: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  // const seed = Mnemonic.fromString(mnemonic).toSeed(); // TypeError: Cannot read property 'fromString' of undefined
  const hdPrivateKey = bsv.HDPrivateKey.fromSeed(seed, bsv.Networks.mainnet);

  const child = hdPrivateKey.deriveChild("m/44'/236'/0'/0/0");

  const address = child.publicKey.toAddress(bsv.Networks.mainnet);

  return { address: address.toString(), privateKey: child.privateKey.toWIF() };
}

export async function queryBalance(): Promise<number> {
  assert.ok(USER_CONFIG.MNEMONIC);

  const address = getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);

  const response = await Axios.get(
    `https://api.whatsonchain.com/v1/bsv/main/address/${address.address}/balance`,
  );

  assert.equal(response.status, 200);
  return response.data.confirmed / 10 ** BSV_DECIMALS;
}
