import { strict as assert } from 'assert';
import { getDefaultProvider, utils, Wallet } from 'ethers';
import { TransactionRequest } from 'ethers/providers';
import { USER_CONFIG } from '../user_config';

export function getEthAddressFromMnemonic(
  mnemonic: string,
): { address: string; privateKey: string } {
  const wallet = Wallet.fromMnemonic(mnemonic);

  return { address: wallet.address, privateKey: wallet.privateKey };
}

export async function getTokenBalance(symbol: string): Promise<number> {
  assert.equal(symbol, 'ETH'); // TODO: ERC20 token
  assert.ok(USER_CONFIG.MNEMONIC);

  const wallet = Wallet.fromMnemonic(USER_CONFIG.MNEMONIC!).connect(getDefaultProvider());

  return parseFloat(utils.formatEther(await wallet.getBalance()));
}

export async function send(
  symbol: string,
  to: string,
  quantity: string,
): Promise<{ [key: string]: any } | Error> {
  assert.equal(symbol, 'ETH'); // TODO: ERC20 token
  assert.ok(USER_CONFIG.MNEMONIC);

  const balance = await getTokenBalance('ETH');
  if (parseFloat(quantity) > balance) {
    return new Error(
      `Insufficient balance, quantity ${quantity} is greater than balance ${balance}`,
    );
  }

  const wallet = Wallet.fromMnemonic(USER_CONFIG.MNEMONIC!).connect(getDefaultProvider());

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
