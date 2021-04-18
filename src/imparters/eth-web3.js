class eth_web3 {
  static tag = 'eth-web3';

  remuneration_uri = {
    'main':'https://ethereum.overhide.io',
    'rinkeby':'https://rinkeby.ethereum.overhide.io'
  };

  constructor(web3_wallet, token, _fetch, fire) {
    this.web3_wallet = web3_wallet;
    this.eth_accounts = web3_wallet.eth_accounts;
    this.token = token;
    this.__fetch = __fetch;
    this.fire = fire;

    web3_wallet.networkChangeDelegates.push((network) => this.onNetworkChange(network));
  }

  onNetworkChange(network) {
    this.fire('onNetworkChange',{imparterTag: eth_web3.tag, name: network, uri: data.remuneration_uri[network]});
  }

  canSetCredentials() {
    return false;
  }

  canGenerateCredentials() {
    return false;
  }    

  canChangeNetwork() {
    return false;
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
    return false;
  }

  getNetwork() {
    return { "name": this.network, "uri": this.remuneration_uri[this.network]};
  }  

  getOverhideRemunerationAPIUri() {
    return this.remuneration_uri[this.network];      
  }  

  getFromDollars(dollarAmount) {
    const hostPrefix = this.network === 'main' ? '' : 'test.';
    const now = (new Date()).toISOString();
    const result = await __fetch(`https://${hostPrefix}rates.overhide.io/rates/eth/${now}`, {
        headers: new Headers({
          'Authorization': `Bearer ${this.token}`
        })
      })
      .then(res => res.json())
      .catch(e => {
        throw String(e)
      });
    if (!result || result.length === 0 || ! 'minrate' in result[0] || result[0].minrate === 0) return 0;
    return dollarAmount / result[0].minrate;
  }

  getTallyDollars(recipient, date) {
    const txs = await this.getTxs(recipient, date, false);
    if (!txs || txs.length == 0) return 0;
    const values = txs.map(t => `${t['transaction-value']}@${(new Date(t['transaction-date'])).toISOString()}`);        
    const hostPrefix = data.ETH_WEB3_IMPARTER_TAG.network === 'main' ? '' : 'test.';
    const now = (new Date()).toISOString();
    var tally = await this.__fetch(`https://${hostPrefix}rates.overhide.io/tallymax/wei/${values.join(',')}`, {
        headers: new Headers({
          'Authorization': `Bearer ${this.token}`
        })
      })
      .then(res => res.text())
      .catch(e => {
        throw String(e)
      });
    return (Math.round(tally * 100) / 100).toFixed(2);
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
    if (!this.network) throw new Error("no network for imparter tag");
    if (!this.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.walletAddress;
    if (!uri) throw new Error('no uri for request, unsupported network selected in wallet?');
    const message = 'verify ownership of address by signing';
    const signature = await this.sign(message);

    return await this.imparter_fns.isSignatureValid_call(uri, signature, message, from, this.token, this.__fetch);
  }

  sign(message) {
    if (!this.walletAddress) throw new Error(`imparter ${eth_web3.tag} not active`);
    this.fire('onWalletPopup', {imparterTag: eth_web3.tag});
    return (await window.web3.eth.personal.sign(message, this.walletAddress, ''));
  }

  createTransaction(amount, to, options) {
    if (!this.network) throw new Error("no network for imparter tag");
    if (!this.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.walletAddress;
    const uri = this.getOverhideRemunerationAPIUri();

    this.fire('onWalletPopup', {imparterTag: eth_web3.tag});
    await (new Promise((resolve, reject) => {
      window.web3.eth.sendTransaction({ from: from, to: to, value: amount })
      .on('confirmation', function (confirmationNumber, receipt) {
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      }); 
    }));

    return true;
  }  
}

export default eth_web3;