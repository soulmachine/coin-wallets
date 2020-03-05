import { strict as assert } from 'assert';

// sort object keys and stringify.
export function stringifyOrder(obj: { [key: string]: any }): string {
  const allKeys: string[] = [];
  JSON.stringify(obj, (key, value) => {
    allKeys.push(key);
    return value;
  });
  allKeys.sort();
  return JSON.stringify(obj, allKeys, 2);
}

export function calcDecimals(amount: string): number {
  if (!amount.includes('.')) return 0;
  return amount.split(' ')[0].split('.')[1].length;
}

export function padDecimals(amount: string, decimals: number): string {
  if (!amount.includes('.')) return `${amount}.${'0'.repeat(decimals)}`;
  const realDecimals = amount.split(' ')[0].split('.')[1].length;
  assert.ok(realDecimals < decimals);
  return amount.padEnd(amount.length + decimals - realDecimals);
}
