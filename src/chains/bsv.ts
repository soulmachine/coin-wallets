// import * as bip39 from 'bip39';
import * as bip39 from 'bip39';
import bsv from 'bsv';

// eslint-disable-next-line import/prefer-default-export
export function getAddressFromMnemonic(mnemonic: string): { address: string; privateKey: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  // const seed = Mnemonic.fromString(mnemonic).toSeed(); // TypeError: Cannot read property 'fromString' of undefined
  const hdPrivateKey = bsv.HDPrivateKey.fromSeed(seed, bsv.Networks.mainnet);

  const child = hdPrivateKey.deriveChild("m/44'/236'/0'/0/0");

  const address = child.publicKey.toAddress(bsv.Networks.mainnet);

  return { address: address.toString(), privateKey: child.privateKey.toWIF() };
}
