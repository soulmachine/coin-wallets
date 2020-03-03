/* eslint-disable camelcase */
import yargs from 'yargs';
import { getAddress, init } from '../index';
import { Address } from '../pojo';
import { stringifyOrder } from '../utils';
import { readConfig, SUPPORTED_SYMBOLS } from './common';

const commandModule: yargs.CommandModule = {
  command: 'addresses',
  describe: 'List all addresses.',
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
  handler: async argv => {
    const params = (argv as any) as {
      symbol: string;
    };

    const userConfig = readConfig();
    init(userConfig);

    const symbols = params.symbol ? [params.symbol] : SUPPORTED_SYMBOLS;

    const result: { [key: string]: Address } = {};
    for (let i = 0; i < symbols.length; i += 1) {
      const symbol = symbols[i];
      const address = await getAddress(symbol); // eslint-disable-line no-await-in-loop
      result[symbol] = address;
    }
    console.info(stringifyOrder(result));
  },
};

export default commandModule;
