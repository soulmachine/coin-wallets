/* eslint-disable camelcase */
import yargs from 'yargs';
import * as BCH from '../chains/bch';
import * as BSV from '../chains/bsv';
import * as BTC from '../chains/btc';
import * as EOS from '../chains/eos';
import * as ETH from '../chains/eth';
import { init } from '../index';
import { Address, PrivateKey } from '../pojo';
import { USER_CONFIG } from '../user_config';
import { stringifyOrder } from '../utils';
import { readConfig, SUPPORTED_SYMBOLS } from './common';

function getPrivateKey(symbol: string): PrivateKey {
  switch (symbol) {
    case 'BCH': {
      const bchAddress = BCH.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!);
      const privateKey: PrivateKey = {
        symbol,
        address: bchAddress.cashAddress,
        privateKey: bchAddress.privateKey,
      };
      privateKey.legacyAddress = bchAddress.legacyAddress;
      privateKey.cashAddress = bchAddress.cashAddress;

      return privateKey;
    }
    case 'BSV':
      return {
        symbol,
        ...BSV.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!),
      };
    case 'BTC':
      return { symbol, ...BTC.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!) };
    case 'EOS': {
      const privateKey = { symbol, ...EOS.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!) };
      Object.assign(privateKey, {
        comment: 'Remember to register the publicKey to your EOS account',
      });
      return privateKey;
    }
    case 'ETC': {
      return { symbol, ...ETH.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!, 'ETC') };
    }
    case 'ETH': {
      return { symbol, ...ETH.getAddressFromMnemonic(USER_CONFIG.MNEMONIC!) };
    }
    default:
      throw new Error(`Unsupported symbol ${symbol}`);
  }
}

const commandModule: yargs.CommandModule = {
  command: 'private_keys',
  describe: 'List all private keys and addresses.',
  // eslint-disable-next-line no-shadow
  builder: yargs =>
    yargs.options({
      symbol: {
        choices: SUPPORTED_SYMBOLS,
        type: 'string',
        describe: 'The currency symbol to query, empty means all',
        demandOption: false,
      },
    }),
  handler: argv => {
    const params = (argv as any) as {
      symbol: string;
    };

    const userConfig = readConfig();
    init(userConfig);

    const symbols = params.symbol ? [params.symbol] : SUPPORTED_SYMBOLS;

    const result: { [key: string]: Address } = {};
    for (let i = 0; i < symbols.length; i += 1) {
      const symbol = symbols[i];
      const address = getPrivateKey(symbol); // eslint-disable-line no-await-in-loop
      result[symbol] = address;
    }
    console.info(stringifyOrder(result));
  },
};

export default commandModule;
