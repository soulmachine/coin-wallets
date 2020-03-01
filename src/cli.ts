#!/usr/bin/env node
import yargs from 'yargs';
import balanceCommand from './commands/balance';
import sendCommand from './commands/send';

// eslint-disable-next-line no-unused-expressions
yargs
  .command(balanceCommand)
  .command(sendCommand)
  .wrap(null)
  .demandCommand(1, '').argv;
