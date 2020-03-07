import { getERC20TokenBalance } from '../src/chains/eth';
import { readConfig } from '../src/commands/common';
import { init } from '../src/index';

beforeAll(async () => {
  const userConfig = readConfig();
  await init(userConfig);
});

test('queryBalance(USDT)', async () => {
  // Binance USDT hot wallet address
  const balanceBinance = await getERC20TokenBalance(
    '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF',
    'USDT',
  );
  expect(balanceBinance).toBeGreaterThan(0);

  const balanceHuobi = await getERC20TokenBalance(
    '0x1062a747393198f70f71ec65a582423dba7e5ab3',
    'USDT',
  );
  expect(balanceHuobi).toBeGreaterThan(0);
});
