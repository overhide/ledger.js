import ohledger_fns from '../fns/ohledger_fns.js';
import imparter_fns from '../fns/imparter_fns.js';

class ohledger {
  static tag = 'ohledger';

  address = null;
  secret = null;
  mode = 'test';

  constructor(overhide_wallet, web3_wallet, getToken, __fetch, fire) {
    this.overhide_wallet = overhide_wallet;
    this.eth_accounts = web3_wallet.eth_accounts;
    this.getToken = getToken;
    this.__fetch = __fetch;
    this.fire = fire;
  }

  canSetCredentials() {
    return true;
  }  

  canGenerateCredentials() {
    return true;
  }  

  canChangeNetwork() {
    return true;
  }  

  setCredentials(credentials) {
    if (!('secret' in credentials)) throw new Error("'secret' must be passed in");
    if ('address' in credentials && credentials.address) {
      this.address = credentials.address.toLowerCase();
    } else {
      this.address = this.eth_accounts.privateKeyToAccount(credentials.secret).address.toLowerCase();
    }
    this.secret = credentials.secret;
    try {
      if (!(this.eth_accounts.recover(this.eth_accounts.sign('test message', this.secret)).toLowerCase() == this.address)) {
        throw new Error("'secret' not valid for 'address");
      }
    } catch (err) {
      throw new Error("'secret' not valid for 'address");
    }        
    this.fire('onCredentialsUpdate', { imparterTag: ohledger.tag, address: this.address, secret: this.secret});
    return true;
  }  

  getCredentials() {
    return {"address":this.address, "secret":this.secret};
  }

  generateCredentials(options) {
    const res = this.eth_accounts.create();
    this.address = res.address.toLowerCase();
    this.secret = res.privateKey;
    this.fire('onCredentialsUpdate', { imparterTag: ohledger.tag, address: this.address, secret: this.secret});
    return true;
  }

  setNetwork(details) {
    ohledger_fns.setNetwork_check_details(details);

    this.mode = details.mode;
    this.fire('onNetworkChange', { imparterTag: ohledger.tag, currency: 'USD', mode: details.mode, uri: this.overhide_wallet.remuneration_uri[details.mode]});
    return true;
  }  

  getNetwork() {
    return { "currency": "USD", "mode": this.mode, "uri": this.overhide_wallet.remuneration_uri[this.mode]};
  }

  getOverhideRemunerationAPIUri() {
    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    return this.overhide_wallet.remuneration_uri[this.mode];
  }

  async getFromDollars(dollarAmount) {
    return dollarAmount * 100;
  }

  async getTallyDollars(recipient, date) {
    var tally = (await this.getTxs(recipient, date, true)).tally;
    return (tally / 100).toFixed(2);
  }

  async getTxs(recipient, date, tallyOnly) {
    imparter_fns.getTxs_check_details(recipient, date);

    const to = recipient.address;
    const uri = this.getOverhideRemunerationAPIUri();

    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.address) throw new Error("from 'address' not set: use setCredentials");
    const from = this.address;

    return await imparter_fns.getTxs_retrieve(uri, from, to, tallyOnly, date, this.getToken(), this.__fetch);
  }

  async isOnLedger() {
    const uri = this.getOverhideRemunerationAPIUri();
    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.address) throw new Error("from 'address' not set: use setCredentials");
    const from = this.address;
    if (!uri) throw new Error('no uri for request, unsupported network selected in wallet?');
    const message = 'verify ownership of address by signing';
    const signature = await this.sign(message);

    return await imparter_fns.isSignatureValid_call(uri, signature, message, from, this.getToken(), this.__fetch);
  }

  async sign(message) {
    if (!this.secret) throw new Error(`credentials for imparter ${ohledger.tag} not set`);
    return this.eth_accounts.sign(message, this.secret).signature;
  }

  async createTransaction(amount, to, options) {
    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.address) throw new Error("from 'address' not set: use setCredentials");
    const from = this.address;
    const uri = this.getOverhideRemunerationAPIUri();

    await ohledger_fns.createTransaction(
      amount, 
      from,
      to,
      (message) => this.sign(message),
      (from, signature, message) => this.overhide_wallet.showOhLedgerGratisIframeUri(uri, from, signature, message), 
      this.overhide_wallet.oh_ledger_transact_fn[this.mode], 
      options);

    return true;
  }  
}

export default ohledger;