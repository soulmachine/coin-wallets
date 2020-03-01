import { createDfuseClient, DfuseClient } from '@dfuse/client';
import { strict as assert } from 'assert';
import { getTokenInfo } from 'eos-token-info';
import { Api, JsonRpc, Serialize } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import fetch, { Request, RequestInit, Response } from 'node-fetch';
import { TextDecoder, TextEncoder } from 'text-encoding';
import { USER_CONFIG } from '../user_config';
import { calcDecimals } from '../utils';

Object.assign(global, { fetch: require('node-fetch') }); // eslint-disable-line global-require
// Object.assign(global, { WebSocket: require('ws') });
Object.assign(global, { WebSocket: {} });

function createCustomizedFetch(
  client: DfuseClient,
): (input: string | Request, init: RequestInit) => Promise<Response> {
  const customizedFetch = async (input: string | Request, init: RequestInit): Promise<Response> => {
    if (init.headers === undefined) {
      init.headers = {}; // eslint-disable-line no-param-reassign
    }

    // This is highly optimized and cached, so while the token is fresh, this is very fast
    const apiTokenInfo = await client.getTokenInfo();

    const headers = init.headers as { [name: string]: string };
    headers.Authorization = `Bearer ${apiTokenInfo.token}`;
    headers['X-Eos-Push-Guarantee'] = 'in-block';

    return fetch(input, init);
  };

  return customizedFetch;
}

export async function sendTransaction(
  actions: Serialize.Action[],
  privateKey: string,
): Promise<
  | {
      transaction_id: string;
      block_id: string;
      block_num: number;
      processed: {
        [key: string]: any;
      };
    }
  | Error
> {
  const client = createDfuseClient({
    apiKey: USER_CONFIG.DFUSE_API_KEY!,
    network: 'mainnet',
  });

  const rpc = new JsonRpc(client.endpoints.restUrl, {
    fetch: createCustomizedFetch(client) as any,
  });
  const api = new Api({
    rpc,
    signatureProvider: new JsSignatureProvider([privateKey]),
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });

  try {
    const result = await api
      .transact(
        {
          actions,
        },
        {
          blocksBehind: 360,
          expireSeconds: 3600,
        },
      )
      .catch((e: Error) => {
        return e;
      });

    client.release();
    return result;
  } catch (e) {
    return e;
  }
}

/**
 * Create a transfer action.
 *
 * @param from The sender's EOS account
 * @param to The receiver's EOS account
 * @param symbol The currency symbol, e.g., EOS, USDT, EIDOS, DICE, KEY, etc.
 * @param quantity The quantity to send
 * @param memo memo
 */
export function createTransferAction(
  from: string,
  to: string,
  symbol: string,
  quantity: string,
  memo = '',
): Serialize.Action {
  const tokenInfo = getTokenInfo(symbol);
  assert.equal(
    calcDecimals(quantity),
    tokenInfo.decimals,
    `The quantity ${quantity} precision is NOT equal to ${tokenInfo.decimals}`,
  );

  const action: Serialize.Action = {
    account: tokenInfo.contract,
    name: 'transfer',
    authorization: [
      {
        actor: from,
        permission: 'active',
      },
    ],
    data: {
      from,
      to,
      quantity: `${quantity} ${symbol}`,
      memo,
    },
  };

  return action;
}

/**
 * Transfer EOS or EOS token to another account.
 *
 * @param from The sender's EOS account
 * @param privateKey The sender's EOS private key
 * @param to The receiver's EOS account
 * @param symbol The currency symbol, e.g., EOS, USDT, EIDOS, DICE, KEY, etc.
 * @param quantity The quantity to send
 * @param memo memo
 */
export async function transfer(
  from: string,
  privateKey: string,
  to: string,
  symbol: string,
  quantity: string,
  memo = '',
): Promise<any> {
  const action = createTransferAction(from, to, symbol, quantity, memo);

  return sendTransaction([action], privateKey);
}

export async function getCurrencyBalance(account: string, symbol: string): Promise<number> {
  assert.ok(USER_CONFIG.DFUSE_API_KEY);

  const tokenInfo = getTokenInfo(symbol);
  if (tokenInfo === undefined) {
    return -1;
    // return new Error(`Can NOT find token ${symbol} on EOS chain`);
  }

  const client = createDfuseClient({
    apiKey: USER_CONFIG.DFUSE_API_KEY!,
    network: 'mainnet',
  });

  const resp = await client.stateTable<{ balance: string }>(
    tokenInfo.contract,
    account,
    'accounts',
  );
  const { balance } = resp.rows[0].json!;

  client.release();
  return parseFloat(balance.split(' ')[0]);
}
