class ohledger_fns {
  static setNetwork_check_details(details) {
    if (!('currency' in details)) throw new Error("'currency' must be passed in");
    if (!('mode' in details)) throw new Error("'mode' must be passed in");
    details.currency = details.currency.toUpperCase();
    details.mode = details.mode.toLowerCase();
    if (details.currency !== 'USD') throw new Error("'currency' must be 'USD'");
    if (details.mode !== 'prod' && details.mode !== 'test') throw new Error("'mode' must be 'prod' or 'test'");    
  }

  static async createTransaction(amount, from, to, signFn, showGratisFn, ohLedgerTransactFn, options) {
    if (amount == 0) {
      if ('message' in options && options.message && 'signature' in options && options.signature) {
        var message = options.message;
        var signature = options.signature;
      } else {
        var message = `verify ownership of address by signing on ${new Date().toLocaleString()}`;
        var signature = await signFn(message);
      }
      await showGratisFn(from, signature, message);
    } else {
      await ohLedgerTransactFn(amount, from, to);
    }
  }
}

export default ohledger_fns;