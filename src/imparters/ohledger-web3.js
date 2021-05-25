import ohledger_fns from '../fns/ohledger_fns.js';
import imparter_fns from '../fns/imparter_fns.js';

class ohledger_web3 {
  static tag = 'ohledger-web3';

  mode = 'test';

  constructor(overhide_wallet, web3_wallet, getToken, __fetch, fire) {
    this.web3_wallet = web3_wallet;
    this.overhide_wallet = overhide_wallet;
    this.__fetch = __fetch;
    this.getToken = getToken;
    this.fire = fire;
  }

  canSetCredentials() {
    return false;
  }  

  canGenerateCredentials() {
    return false;
  }    

  canChangeNetwork() {
    return true;
  }  
  
  setCredentials(credentials) {
    return false;
  }  

  getCredentials() {
    return {"address": this.web3_wallet.walletAddress};
  }  

  generateCredentials(options) {
    return false;
  }

  setNetwork(details) {
    ohledger_fns.setNetwork_check_details(details);

    this.mode = details.mode;
    this.fire('onNetworkChange', { imparterTag: ohledger_web3.tag, currency: 'USD', mode: details.mode, uri: this.overhide_wallet.remuneration_uri[details.mode] });
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

  async getTxs(recipient, date, tallyOnly, tallyDollars) {
    imparter_fns.getTxs_check_details(recipient, date);

    const to = recipient.address;
    const uri = this.getOverhideRemunerationAPIUri();

    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.web3_wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    var from = this.web3_wallet.walletAddress;

    return await imparter_fns.getTxs_retrieve(uri, from, to, tallyOnly, tallyDollars, date, this.getToken(), this.__fetch);
  }  

  async isOnLedger(options) {
    const uri = this.getOverhideRemunerationAPIUri();
    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.web3_wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.web3_wallet.walletAddress;
    if (!uri) throw new Error('no uri for request, unsupported network selected in wallet?');

    if ('message' in options && options.message && 'signature' in options && options.signature) {
      var message = options.message;
      var signature = options.signature;
    } else {
      var message = `verify ownership of address by signing on ${new Date().toLocaleString()}`;
      var signature = await this.sign(message);
    }

    return await imparter_fns.isSignatureValid_call(uri, signature, message, from, this.getToken(), this.__fetch);
  }

  async sign(message) {
    if (!this.web3_wallet.walletAddress) throw new Error(`imparter ${ohledger_web3.tag} not active`);
    this.fire('onWalletPopup', {imparterTag: ohledger_web3.tag});
    return (await window.web3.eth.personal.sign(message, this.web3_wallet.walletAddress, ''));
  }

  async createTransaction(amount, to, options) {
    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.web3_wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.web3_wallet.walletAddress;
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

export default ohledger_web3;