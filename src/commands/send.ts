/* eslint-disable camelcase */
import yargs from 'yargs';
import { init, send } from '../index';
import { SYMBOLS_REQUIRE_MEMO } from '../pojo';
import { readConfig, SUPPORTED_SYMBOLS } from './common';

const commandModule: yargs.CommandModule = {
  command: 'send <symbol> <address> <amount> [memo]',
  describe: 'Send currencies.',
  // eslint-disable-next-line no-shadow
  builder: yargs =>
    yargs
      .positional('symbol', {
        choices: SUPPORTED_SYMBOLS,
        type: 'string',
        describe: 'The currency symbol',
        demandOption: true,
      })
      .positional('address', {
        type: 'string',
        describe: 'The destination address',
        demandOption: true,
      })
      .positional('amount', {
        type: 'string',
        describe: 'How many to send',
        demandOption: true,
      })
      .options({
        memo: {
          type: 'string',
          describe: `Some currencies require a memo, such as ${SYMBOLS_REQUIRE_MEMO.join(',')}`,
          demandOption: false,
        },
      }),
  handler: async argv => {
    const params = (argv as any) as {
      symbol: string;
      address: string;
      amount: string;
      memo?: string;
    };

    const userConfig = readConfig();
    init(userConfig);

    console.info(
      await send(
        { symbol: params.symbol, address: params.address, memo: params.memo },
        params.amount,
      ),
    );
  },
};

export default commandModule;
