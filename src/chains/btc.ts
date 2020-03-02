import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

// copied from https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/bip32.spec.ts#L7
function getAddress(node: any, network?: any): string {
  return bitcoin.payments.p2pkh({ pubkey: node.publicKey, network }).address!;
}

// eslint-disable-next-line import/prefer-default-export
export function getBTCAddressFromMnemonic(
  mnemonic: string,
): { address: string; privateKey: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const node = bitcoin.bip32.fromSeed(seed);
  const child1 = node.derivePath("m/44'/0'/0'/0/0");

  const address = getAddress(child1);
  const privateKey = child1.toWIF();

  return { address, privateKey };
}
