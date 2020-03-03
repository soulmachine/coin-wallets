#!/usr/bin/env node
import yargs from 'yargs';
import addressCommand from './commands/addresses';
import balanceCommand from './commands/balance';
import privateKeysCommand from './commands/private_keys';
import sendCommand from './commands/send';
// eslint-disable-next-line no-unused-expressions
yargs
  .command(addressCommand)
  .command(balanceCommand)
  .command(privateKeysCommand)
  .command(sendCommand)
  .wrap(null)
  .demandCommand(1, '').argv;
