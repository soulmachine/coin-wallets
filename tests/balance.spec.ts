import { getBalance, getERC20TokenBalance } from '../src/chains/eth';
import { readConfig } from '../src/commands/common';
import { init } from '../src/index';

beforeAll(async () => {
  const userConfig = readConfig();
  await init(userConfig);
});

test('getBalance(ETH)', async () => {
  // Binance ETH hot wallet address
  const balanceBinance = await getBalance('ETH', '0x564286362092d8e7936f0549571a803b203aaced');
  expect(balanceBinance).toBeGreaterThan(0);

  // Huobi ETH hot wallet address
  const balanceHuobi = await getBalance('ETH', '0x5861b8446A2F6e19a067874c133f04c578928727');
  expect(balanceHuobi).toBeGreaterThan(0);

  // OKEx ETH hot wallet address
  const okexBinance = await getBalance('ETH', '0xA7EFAe728D2936e78BDA97dc267687568dD593f3');
  expect(okexBinance).toBeGreaterThan(0);
});

test('getBalance(ETC)', async () => {
  // Binance ETC hot wallet address
  const balanceBinance = await getBalance('ETC', '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be');
  expect(balanceBinance).toBeGreaterThan(0);

  // Huobi ETC hot wallet address
  const balanceHuobi = await getBalance('ETC', '0x6667ed6cb6e7accc4004e8844dbdd0e72d58c31c');
  expect(balanceHuobi).toBeGreaterThan(0);
});

test('getERC20TokenBalance(USDT)', async () => {
  // Binance USDT hot wallet address
  const balanceBinance = await getERC20TokenBalance(
    'USDT',
    '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF',
  );
  expect(balanceBinance).toBeGreaterThan(0);

  // Huobi USDT hot wallet address
  const balanceHuobi = await getERC20TokenBalance(
    'USDT',
    '0x1062a747393198f70f71ec65a582423dba7e5ab3',
  );
  expect(balanceHuobi).toBeGreaterThan(0);

  // OKEx USDT hot wallet address
  const balanceOKEx = await getERC20TokenBalance(
    'USDT',
    '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b',
  );
  expect(balanceOKEx).toBeGreaterThan(0);
});
