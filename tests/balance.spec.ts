import { getERC20TokenBalance } from '../src/chains/eth';
import { readConfig } from '../src/commands/common';
import { init } from '../src/index';

beforeAll(async () => {
  const userConfig = readConfig();
  await init(userConfig);
});

test('queryBalance(USDT)', async () => {
  const balance = await getERC20TokenBalance('0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF', 'USDT');

  expect(balance).toBeGreaterThan(0);
});
