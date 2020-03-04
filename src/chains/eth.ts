import { strict as assert } from 'assert';
import { getDefaultProvider, utils, Wallet } from 'ethers';
import { TransactionRequest } from 'ethers/providers';
import { USER_CONFIG } from '../user_config';

function getWallet(mnemonic: string, chain: 'ETH' | 'ETC' = 'ETH'): Wallet {
  const network = chain === 'ETH' ? 'mainnet' : 'classic';
  const provider = getDefaultProvider(utils.getNetwork(network));
  return Wallet.fromMnemonic(
    mnemonic,
    chain === 'ETC' ? "m/44'/61'/0'/0/0" : "m/44'/60'/0'/0/0",
  ).connect(provider);
}

export function getAddressFromMnemonic(
  mnemonic: string,
  chain: 'ETH' | 'ETC' = 'ETH',
): { address: string; privateKey: string } {
  const wallet = getWallet(mnemonic, chain);

  return { address: wallet.address, privateKey: wallet.privateKey };
}

export async function getTokenBalance(symbol: 'ETH' | 'ETC' = 'ETH'): Promise<number> {
  assert.ok(symbol === 'ETH' || symbol === 'ETC'); // TODO: ERC20 token
  assert.ok(USER_CONFIG.MNEMONIC);

  const wallet = getWallet(USER_CONFIG.MNEMONIC!, symbol);

  return parseFloat(utils.formatEther(await wallet.getBalance()));
}

export async function send(
  symbol: 'ETH' | 'ETC' = 'ETH',
  to: string,
  quantity: string,
): Promise<{ [key: string]: any } | Error> {
  assert.ok(symbol === 'ETH' || symbol === 'ETC'); // TODO: ERC20 token
  assert.ok(USER_CONFIG.MNEMONIC);

  const balance = await getTokenBalance('ETH');
  if (parseFloat(quantity) > balance) {
    return new Error(
      `Insufficient balance, quantity ${quantity} is greater than balance ${balance}`,
    );
  }

  const wallet = getWallet(USER_CONFIG.MNEMONIC!, symbol);

  // const nonce = await wallet.getTransactionCount();
  // console.info(nonce);
  const transaction: TransactionRequest = {
    // nonce,
    // gasLimit: 21000,
    // gasPrice: utils.bigNumberify('2000000000'),
    to,
    value: utils.parseEther(quantity),
    data: '0x',
  };

  return wallet.sendTransaction(transaction).catch((e: Error) => {
    return e;
  });
}
