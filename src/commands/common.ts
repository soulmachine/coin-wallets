import * as dotenv from 'dotenv';
import fs from 'fs';
import { UserConfig } from '../user_config';

// eslint-disable-next-line import/prefer-default-export
export function readConfig(): UserConfig {
  if (!fs.existsSync('.env')) {
    throw new Error('Please put a .env file at project root directory');
  }
  const ENV = dotenv.config().parsed!;

  return ENV as UserConfig;
}

export const SUPPORTED_SYMBOLS = ['EOS', 'ETH'];
