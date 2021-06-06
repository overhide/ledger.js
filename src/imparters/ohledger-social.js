import ohledger_fns from '../fns/ohledger_fns.js';
import imparter_fns from '../fns/imparter_fns.js';

class ohledger_social {
  static tag = 'ohledger-social';

  address = null;
  mode = 'test';
  social = null;

  constructor(domFns, overhide_wallet, web3_wallet, getToken, __fetch, fire) {
    this.domFns = domFns;
    this.overhide_wallet = overhide_wallet;
    this.eth_accounts = web3_wallet.eth_accounts;
    this.getToken = getToken;
    this.__fetch = __fetch;
    this.fire = fire;

    window.addEventListener('message', (e) => {
      if (!e.data || !e.data.event) return;
      switch(e.data.event) {
        case 'oh$-login-success':
          this.domFns.makePopupHidden('login success', false);          
          break;
        case 'oh$-login-failed':
          this.domFns.makePopupHidden('login failure', true);
          break;
        case 'oh$-logout-success':
          this.domFns.makePopupHidden('logout', false);
          break;
      }
    });    
  }

  canSetCredentials() {
    return true;
  }  

  canGenerateCredentials() {
    return false;
  }  

  canChangeNetwork() {
    return true;
  }  

  async setCredentials(credentials) {
    if (!credentials) {
      if (!this.social) throw new Error("Not logged in");    
      this.domFns.hideAllPopupContents();
      this.domFns.setFrame(`https://social.overhide.io/pending`, 30, 10);
      const popupPromise = this.domFns.makePopupVisible();           
      window.open(`https://overhide.b2clogin.com/overhide.onmicrosoft.com/B2C_1_${this.social}/oauth2/v2.0/logout?redirect_uri=https%3A%2F%2Fsocial.overhide.io%2Flogout`,
        '_blank',
        {height: 300, width: 300}
      );
      await popupPromise;
      this.address = null;
      this.social = null;
    } else if ('provider' in credentials) {
      this.social = credentials.provider;
    } else {
      throw new Error("Incorrect credentials options, 'provider' is mandatory.");
    }
    this.fire('onCredentialsUpdate', { imparterTag: ohledger_social.tag, address: this.address });
    return true;
  }  

  getCredentials() {
    return {"address":this.address};
  }

  generateCredentials(options) {
    return false;
  }

  setNetwork(details) {
    ohledger_fns.setNetwork_check_details(details);

    this.mode = details.mode;
    this.fire('onNetworkChange', { imparterTag: ohledger_social.tag, currency: 'USD', mode: details.mode, uri: this.overhide_wallet.remuneration_uri[details.mode]});
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
    if (!this.address) throw new Error("from 'address' not set: use setCredentials");
    const from = this.address;

    return await imparter_fns.getTxs_retrieve(uri, from, to, tallyOnly, tallyDollars, date, this.getToken(), this.__fetch);
  }

  async isOnLedger(options) {
    const uri = this.getOverhideRemunerationAPIUri();
    if (!this.mode) throw new Error("network 'mode' must be set, use setNetwork");
    if (!this.address) throw new Error("from 'address' not set: use setCredentials");
    const from = this.address;
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
    try {
      const res = this.eth_accounts.create();
      const karnet = res.privateKey;
      this.domFns.hideAllPopupContents();
      this.domFns.setFrame(`https://social.overhide.io/pending`, 30, 10);
      const popupPromise = this.domFns.makePopupVisible();     
      window.open(
        `https://overhide.b2clogin.com/overhide.onmicrosoft.com/B2C_1_${this.social}/oauth2/v2.0/authorize?client_id=aa71ffc7-2884-4045-898f-7db3a177c1a1&response_type=code&redirect_uri=https%3A%2F%2Fsocial.overhide.io%2Fredirect/${this.social}&response_mode=query&scope=aa71ffc7-2884-4045-898f-7db3a177c1a1&state=${karnet}`,
        '_blank',
        {height: 300, width: 300}
      );
      await popupPromise;
      return await this.__fetch(`https://social.overhide.io/sign?karnet=${karnet}&message=${btoa(message)}`, {
        method: "GET",
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${this.getToken()}`
        }})
      .then(async (result) => {
        if (result.status == 200) {
          const resultValue = await result.json();
          this.address = resultValue.address;
          return atob(resultValue.signature);
        } else {
          throw new Error(await result.text());
        }
      });
    } catch(e) {
      throw String(e)
    }  
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

export default ohledger_social;