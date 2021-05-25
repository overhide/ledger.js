import imparter_fns from '../fns/imparter_fns.js';

class btc_liquality {
  static tag = 'btc-liquality';

  remuneration_uri = {
    'bitcoin':'https://bitcoin.overhide.io',
    'bitcoin_testnet':'https://test.bitcoin.overhide.io'
  };

  constructor(wallet, getToken, __fetch, fire) {
    this.wallet = wallet;
    this.getToken = getToken;
    this.__fetch = __fetch;
    this.fire = fire;

    wallet.networkChangeDelegates.push((network) => this.onNetworkChange(network));
  }

  onNetworkChange(network) {
    this.fire('onNetworkChange',{imparterTag: btc_liquality.tag, name: network, uri: this.remuneration_uri[network]});
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
    return {"address":this.wallet.walletAddress};
  }    

  generateCredentials(options) {
    return false;
  }  

  setNetwork(details) {
    return false;
  }

  getNetwork() {
    return { "name": this.wallet.network, "uri": this.remuneration_uri[this.wallet.network]};
  }  

  getOverhideRemunerationAPIUri() {
    return this.remuneration_uri[this.wallet.network];      
  }  

  async getFromDollars(dollarAmount) {
    const hostPrefix = this.wallet.network === 'main' ? '' : 'test.';
    const now = (new Date()).toISOString();
    const result = await this.__fetch(`https://${hostPrefix}rates.overhide.io/rates/wei/${now}`, {
        headers: new Headers({
          'Authorization': `Bearer ${this.getToken()}`
        })
      })
      .then(res => res.json())
      .catch(e => {
        throw String(e)
      });
    if (!result || result.length === 0 || ! 'minrate' in result[0] || result[0].minrate === 0) return 0;
    return dollarAmount / result[0].minrate;
  }

  async getTxs(recipient, date, tallyOnly, tallyDollars) {
    imparter_fns.getTxs_check_details(recipient, date);

    const to = recipient.address;
    const uri = this.getOverhideRemunerationAPIUri();

    if (!this.wallet.network) throw new Error("network must be set in wallet");
    if (!this.wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    var from = this.wallet.walletAddress;

    return await imparter_fns.getTxs_retrieve(uri, from, to, tallyOnly, tallyDollars, date, this.getToken(), this.__fetch);
  }  

  async isOnLedger(options) {
    const uri = this.getOverhideRemunerationAPIUri();
    if (!this.wallet.network) throw new Error("no network for imparter tag");
    if (!this.wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.wallet.walletAddress;
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
    if (!this.wallet.walletAddress) throw new Error(`imparter ${btc_liquality.tag} not active`);
    this.fire('onWalletPopup', {imparterTag: btc_liquality.tag});
    return (await window.bitcoin.request({ method: 'wallet_signMessage', params: [ message, this.wallet.walletAddress ] }));
  }

  async createTransaction(amount, to, options) {
    if (!this.wallet.network) throw new Error("no network for imparter tag");
    if (!this.wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.wallet.walletAddress;
    const uri = this.getOverhideRemunerationAPIUri();

    this.fire('onWalletPopup', {imparterTag: btc_liquality.tag});
    await bitcoin.request({ method: 'wallet_sendTransaction', params: [to, amount] })

    return true;
  }  
}

export default btc_liquality;