import * as BCH from '../src/chains/bch';
import * as BSV from '../src/chains/bsv';
import * as BTC from '../src/chains/btc';
import * as ETH from '../src/chains/eth';
import { readConfig } from '../src/commands/common';
import { init } from '../src/index';

beforeAll(async () => {
  const userConfig = readConfig();
  await init(userConfig);
});

test('getBalance(BCH)', async () => {
  // Huobi BCH hot wallet address
  const balanceHuobi = await BCH.getBalance(
    'bitcoincash:qzgk42r8x5vvsgj36sckwjtn009qtjmhccrf8efzha',
  );
  expect(balanceHuobi).toBeGreaterThan(1);

  // OKEx BCH hot wallet address
  const balanceOKEx = await BCH.getBalance(
    'bitcoincash:ppjatcwh9l8285288gzr782ps9r542yl6crrfl2ghf',
  );
  expect(balanceOKEx).toBeGreaterThan(1);
});

test('getBalance(BSV)', async () => {
  // Huobi BCH hot wallet address
  const balanceHuobi = await BSV.getBalance('14DNaiu2GFnWDBf5Tf7tatmiiAR2vvYCyj');
  expect(balanceHuobi).toBeGreaterThan(1);

  // OKEx BCH hot wallet address
  const balanceOKEx = await BSV.getBalance('1LPzLSMypuAuRivjNp4zQW1CNHk9fpmXRE');
  expect(balanceOKEx).toBeGreaterThan(1);
});

test('getBalance(BTC)', async () => {
  // Binance BTC hot wallet address
  const balanceBinance = await BTC.getBalance('1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s');
  expect(balanceBinance).toBeGreaterThan(1);

  // Huobi BTC hot wallet address
  const balanceHuobi = await BTC.getBalance('1N654W3VZfzYFt1nRNKHis22b97ssEA2sG');
  expect(balanceHuobi).toBeGreaterThan(1);
});

test('getBalance(ETH)', async () => {
  // Binance ETH hot wallet address
  const balanceBinance = await ETH.getBalance('ETH', '0x564286362092d8e7936f0549571a803b203aaced');
  expect(balanceBinance).toBeGreaterThan(1);

  // Huobi ETH hot wallet address
  const balanceHuobi = await ETH.getBalance('ETH', '0x5861b8446A2F6e19a067874c133f04c578928727');
  expect(balanceHuobi).toBeGreaterThan(1);

  // OKEx ETH hot wallet address
  const okexBinance = await ETH.getBalance('ETH', '0xA7EFAe728D2936e78BDA97dc267687568dD593f3');
  expect(okexBinance).toBeGreaterThan(1);
});

test('getBalance(ETC)', async () => {
  // Binance ETC hot wallet address
  const balanceBinance = await ETH.getBalance('ETC', '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be');
  expect(balanceBinance).toBeGreaterThan(1);

  // Huobi ETC hot wallet address
  const balanceHuobi = await ETH.getBalance('ETC', '0x6667ed6cb6e7accc4004e8844dbdd0e72d58c31c');
  expect(balanceHuobi).toBeGreaterThan(1);
});

test('getERC20TokenBalance(USDT)', async () => {
  // Binance USDT hot wallet address
  const balanceBinance = await ETH.getERC20TokenBalance(
    'USDT',
    '0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF',
  );
  expect(balanceBinance).toBeGreaterThan(1);

  // Huobi USDT hot wallet address
  const balanceHuobi = await ETH.getERC20TokenBalance(
    'USDT',
    '0x1062a747393198f70f71ec65a582423dba7e5ab3',
  );
  expect(balanceHuobi).toBeGreaterThan(1);

  // OKEx USDT hot wallet address
  const balanceOKEx = await ETH.getERC20TokenBalance(
    'USDT',
    '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b',
  );
  expect(balanceOKEx).toBeGreaterThan(1);
});
