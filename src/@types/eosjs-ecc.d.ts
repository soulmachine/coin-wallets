declare module 'eosjs-ecc' {
  function isValidPrivate(privateKey: string): boolean;
  function isValidPublic(publicKey: string): boolean;
  function privateToPublic(privateKey: string): string;
  function sign(data: string, privateKey: string): string;
  function signHash(dataSha256: string | Buffer, privateKey: string): string;
}
