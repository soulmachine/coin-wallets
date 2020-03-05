import { strict as assert } from 'assert';
import { getDefaultProvider, providers, utils, Wallet } from 'ethers';
import { TransactionRequest } from 'ethers/providers';
import { USER_CONFIG } from '../user_config';
import { calcDecimals } from '../utils';

const ETH_DECIMALS = 18;

function getWallet(mnemonic: string, chain: 'ETH' | 'ETC' = 'ETH'): Wallet {
  const provider =
    chain === 'ETH'
      ? getDefaultProvider()
      : new providers.JsonRpcProvider('https://www.ethercluster.com/etc', 'classic');

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
  speed: 'Slow' | 'Average' | 'Fast' = 'Average',
): Promise<{ [key: string]: any } | Error> {
  assert.ok(symbol === 'ETH' || symbol === 'ETC'); // TODO: ERC20 token
  assert.ok(USER_CONFIG.MNEMONIC);

  if (calcDecimals(quantity) > ETH_DECIMALS) {
    return new Error(
      `The quantity ${quantity} precision is greater than ${symbol} decimals ${ETH_DECIMALS}`,
    );
  }

  const balance = await getTokenBalance(symbol);
  if (parseFloat(quantity) > balance) {
    return new Error(
      `Insufficient balance, quantity ${quantity} is greater than balance ${balance}`,
    );
  }

  const wallet = getWallet(USER_CONFIG.MNEMONIC!, symbol);
  const gasPriceMap = {
    Slow: '300000000', // 0.3 Gwei
    Average: '1000000000', // 1 Gwei
    Fast: '2000000000', // 2 Gwei
  };

  // const nonce = await wallet.getTransactionCount();
  // console.info(nonce);
  const transaction: TransactionRequest = {
    // nonce,
    gasLimit: 21000,
    gasPrice: utils.bigNumberify(gasPriceMap[speed]),
    to,
    value: utils.parseEther(quantity),
    data: '0x',
  };

  return wallet.sendTransaction(transaction).catch((e: Error) => {
    return e;
  });
}
