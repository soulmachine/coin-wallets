import { strict as assert } from 'assert';
import Axios from 'axios';
import { getTokenInfo } from 'erc20-token-list';
import { Contract, getDefaultProvider, providers, utils, Wallet } from 'ethers';
import { TransactionRequest } from 'ethers/providers';
import { USER_CONFIG } from '../user_config';
import { calcDecimals, detectPlatformFromAddress, isETHAddress } from '../utils';

const ETH_DECIMALS = 18;

function getProvider(chain: 'ETH' | 'ETC' = 'ETH'): providers.BaseProvider {
  const provider =
    chain === 'ETH'
      ? getDefaultProvider()
      : new providers.JsonRpcProvider('https://www.ethercluster.com/etc', 'classic');
  return provider;
}

function getWallet(mnemonic: string, chain: 'ETH' | 'ETC' = 'ETH'): Wallet {
  const provider = getProvider(chain);

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

export async function getBalance(symbol: 'ETH' | 'ETC', address: string): Promise<number> {
  assert.ok(symbol === 'ETH' || symbol === 'ETC'); // TODO: ERC20 token
  assert.ok(isETHAddress(address));

  const provider = getProvider(symbol);

  return parseFloat(utils.formatEther(await provider.getBalance(address)));
}

export async function getERC20TokenBalance(symbol: string, address: string): Promise<number> {
  assert.ok(symbol);
  const tokenInfo = getTokenInfo(symbol);
  if (tokenInfo === undefined) {
    throw new Error(`Can NOT find ERC20 contract address of ${symbol}`);
  }
  if (detectPlatformFromAddress(address) !== 'ERC20') {
    throw new Error(`${address} is NOT a valid ETH address`);
  }

  const contractAbiFragment = [
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [
        {
          name: '_owner',
          type: 'address',
        },
      ],
      outputs: [
        {
          name: 'balance',
          type: 'uint256',
        },
      ],
      constant: true,
      payable: false,
    },
  ];

  const provider = getProvider('ETH');
  const contract = new Contract(tokenInfo.address, contractAbiFragment, provider);

  const balance: utils.BigNumber = await contract.balanceOf(address);

  return parseFloat(utils.formatUnits(balance, tokenInfo.decimals));
}

export async function getERC20TokenBalanceList(
  address: string,
  symbols: string[],
): Promise<{ [key: string]: number }> {
  const result: { [key: string]: number } = {};

  for (let i = 0; i < symbols.length; i += 1) {
    const symbol = symbols[i];
    const balance = await getERC20TokenBalance(symbol, address); // eslint-disable-line no-await-in-loop
    result[symbol] = balance;
  }
  return result;
}

export async function getAllERC20TokensBalance(
  address: string,
  size = 100,
): Promise<{ [key: string]: number }> {
  assert.ok(USER_CONFIG.AMBERDATA_API_KEY);

  const result: { [key: string]: number } = {};

  const response = await Axios.get(
    `https://web3api.io/api/v2/addresses/${address}/tokens?sortType=amount&direction=&descendingpage=0&size=${size}`,
    {
      headers: {
        'x-amberdata-blockchain-id': 'ethereum-mainnet',
        'x-api-key': USER_CONFIG.AMBERDATA_API_KEY!,
      },
    },
  ).catch((e: Error) => {
    return e;
  });
  if (response instanceof Error) {
    // console.error(response);
    return result;
  }

  assert.equal(response.status, 200);
  assert.equal(response.data.status, 200);
  assert.equal(response.data.title, 'OK');

  const arr = response.data.payload.records as {
    address: string;
    holder: string;
    amount: string;
    decimals: string;
    name: string;
    symbol: string;
    isERC20: boolean;
    isERC721: boolean;
    isERC777: boolean;
    isERC884: boolean;
    isERC998: boolean;
  }[];

  arr.forEach(x => {
    result[x.symbol] = parseFloat(
      utils.formatUnits(utils.bigNumberify(x.amount), parseInt(x.decimals, 10)),
    );
  });

  return result;
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

  const wallet = getWallet(USER_CONFIG.MNEMONIC!, symbol);

  const balance = await getBalance(symbol, wallet.address);
  if (parseFloat(quantity) > balance) {
    return new Error(
      `Insufficient balance, quantity ${quantity} is greater than balance ${balance}`,
    );
  }

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
