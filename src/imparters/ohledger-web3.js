class ohledger_web3 {
  static tag = 'ohledger-web3';

  walletAddress = null;
  mode = 'test';

  constructor(overhide_wallet, token, __fetch, fire) {
    this.overhide_wallet = overhide_wallet;
    this.__fetch = __fetch;
    this.token = token;
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
    return {"address":this.walletAddress};
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

  getFromDollars(dollarAmount) {
    return dollarAmount * 100;
  }

  getTallyDollars(recipient, date) {
    var tally = await getTally(imparterTag, recipient, date);
    return (tally / 100).toFixed(2);
  }

  getTxs(recipient, date, tallyOnly) {
    this.imparter_fns.getTxs_check_details(recipient, date);

    const to = recipient.address;
    const uri = getOverhideRemunerationAPIUri(imparterTag);

    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    var from = this.walletAddress;

    return await this.imparter_fns.getTxs_retrieve(uri, from, to, tallyOnly, date, this.token, this.__fetch);
  }  

  isOnLedger() {
    const uri = this.getOverhideRemunerationAPIUri();
    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.walletAddress;
    if (!uri) throw new Error('no uri for request, unsupported network selected in wallet?');
    const message = 'verify ownership of address by signing';
    const signature = await this.sign(message);

    return await this.imparter_fns.isSignatureValid_call(uri, signature, message, from, this.token, this.__fetch);
  }

  sign(message) {
    if (!this.walletAddress) throw new Error(`imparter ${ohledger_web3.tag} not active`);
    this.fire('onWalletPopup', {imparterTag: ohledger_web3.tag});
    return (await window.web3.eth.personal.sign(message, this.walletAddress, ''));
  }

  createTransaction(amount, to, options) {
    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.walletAddress;
    const uri = this.getOverhideRemunerationAPIUri();

    await this.ohledger_fns.createTransaction(
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