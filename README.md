# crypto-wallet

One library to manage all cryptocurrencies.

## How to use

```javascript
/* eslint-disable import/no-unresolved,no-console */
const { init, send } = require('crypto-wallet');

init({
  eosAccount: 'Your EOS account',
  eosPrivateKey: 'Your EOS private key',
  DFUSE_API_KEY: 'Yur DFuse.io API key',
});

console.info(await send({ symbol: 'EOS', address: 'EOS account', memo: 'EOS memo' }, '0.0001'));
```

## Quick Start

```bash
npx crypto-wallet balance
```
