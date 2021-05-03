import imparter_fns from '../fns/imparter_fns.js';

class eth_web3 {
  static tag = 'eth-web3';

  remuneration_uri = {
    'main':'https://ethereum.overhide.io',
    'rinkeby':'https://rinkeby.ethereum.overhide.io'
  };

  constructor(web3_wallet, getToken, __fetch, fire) {
    this.web3_wallet = web3_wallet;
    this.eth_accounts = web3_wallet.eth_accounts;
    this.getToken = getToken;
    this.__fetch = __fetch;
    this.fire = fire;

    web3_wallet.networkChangeDelegates.push((network) => this.onNetworkChange(network));
  }

  onNetworkChange(network) {
    this.fire('onNetworkChange',{imparterTag: eth_web3.tag, name: network, mode: network == 'main' ? 'prod' : 'test', uri: this.remuneration_uri[network]});
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
    return {"address":this.web3_wallet.walletAddress};
  }    

  generateCredentials(options) {
    return false;
  }  

  setNetwork(details) {
    return false;
  }

  getNetwork() {
    return { "name": this.web3_wallet.network, "mode": this.web3_wallet.network == 'main' ? 'prod' : 'test', "uri": this.remuneration_uri[this.web3_wallet.network]};
  }  

  getOverhideRemunerationAPIUri() {
    return this.remuneration_uri[this.web3_wallet.network];      
  }  

  async getFromDollars(dollarAmount) {
    const hostPrefix = this.web3_wallet.network === 'main' ? '' : 'test.';
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

    if (!this.web3_wallet.network) throw new Error("network must be set in wallet");
    if (!this.web3_wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    var from = this.web3_wallet.walletAddress;

    return await imparter_fns.getTxs_retrieve(uri, from, to, tallyOnly, tallyDollars, date, this.getToken(), this.__fetch);
  }  

  async isOnLedger() {
    const uri = this.getOverhideRemunerationAPIUri();
    if (!this.web3_wallet.network) throw new Error("no network for imparter tag");
    if (!this.web3_wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.web3_wallet.walletAddress;
    if (!uri) throw new Error('no uri for request, unsupported network selected in wallet?');
    const message = 'verify ownership of address by signing';
    const signature = await this.sign(message);

    return await imparter_fns.isSignatureValid_call(uri, signature, message, from, this.getToken(), this.__fetch);
  }

  async sign(message) {
    if (!this.web3_wallet.walletAddress) throw new Error(`imparter ${eth_web3.tag} not active`);
    this.fire('onWalletPopup', {imparterTag: eth_web3.tag});
    return (await window.web3.eth.personal.sign(message, this.web3_wallet.walletAddress, ''));
  }

  async createTransaction(amount, to, options) {
    if (!this.web3_wallet.network) throw new Error("no network for imparter tag");
    if (!this.web3_wallet.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
    const from = this.web3_wallet.walletAddress;
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