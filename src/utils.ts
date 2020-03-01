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
