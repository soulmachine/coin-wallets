/* eslint-disable camelcase */
import yargs from 'yargs';
import { getBalance, init } from '../index';
import { stringifyOrder } from '../utils';
import { readConfig, SUPPORTED_SYMBOLS } from './common';

const commandModule: yargs.CommandModule = {
  command: 'balance [symbol]',
  describe: 'Query balance.',
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
    await init(userConfig);

    const symbols = params.symbol ? [params.symbol] : SUPPORTED_SYMBOLS;

    const result: { [key: string]: number } = {};
    for (let i = 0; i < symbols.length; i += 1) {
      const symbol = symbols[i];
      const balance = await getBalance(symbol); // eslint-disable-line no-await-in-loop
      result[symbol] = balance;
    }
    console.info(stringifyOrder(result));
  },
};

export default commandModule;
