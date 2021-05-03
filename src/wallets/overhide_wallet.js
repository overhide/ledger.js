class overhide_wallet {
  oh_ledger_transact_fn = {
    'prod': null,
    'test': null
  };

  remuneration_uri = {
    'prod': 'https://ledger.overhide.io/v1',
    'test': 'https://test.ledger.overhide.io/v1'
  }

  constructor(domFns) {
    this.domFns = domFns;

    window.addEventListener('message', (e) => {
      if (e.data && e.data.event === 'oh-ledger-ok') {
        this.domFns.makePopupHidden(e.data.detail);
      } else if (e.data && e.data.event === 'oh-ledger-error') {
        this.domFns.makePopupHidden(e.data.detail, true);
      }
    }, false);
  }

  // initialize this after all dependencies wired up
  init() {
    this.attach();
  }
  
  attach = () => {
    if (document.body) {
      this.loadOhLedgerTransactFns();
    } else {
      setTimeout(this.attach, 100);
    };
  };

  async showOhLedgerGratisIframeUri(uri, from, signature, message) {
    this.domFns.hideAllPopupContents();
    this.domFns.setFrame(`${uri}/gratis.html?address=${from}&signature=${signature}&message=${message}`);
    await this.domFns.makePopupVisible();
  }

  // https://stackoverflow.com/a/31374433
  loadJS(url, implementationCode, location) {
    //url is URL of external file, implementationCode is the code
    //to be called from the file, location is the location to 
    //insert the <script> element

    var scriptTag = document.createElement('script');
    scriptTag.src = url;

    scriptTag.onload = implementationCode;
    scriptTag.onreadystatechange = implementationCode;

    location.appendChild(scriptTag);
  };

  loadOhLedgerTransactFns() {
    // load prod ohledger transact fn
    this.loadJS(`${this.remuneration_uri.prod}/transact.js`, () => {
      const fn = oh_ledger_transact;
      this.oh_ledger_transact_fn.prod = (...args) => { fn(...args); return this.domFns.setupNewPromise(); }
    }, document.body);

    // load test ohledger transact fn
    this.loadJS(`${this.remuneration_uri.test}/transact.js`, () => {
      const fn = oh_ledger_transact;
      this.oh_ledger_transact_fn.test = (...args) => { fn(...args); return this.domFns.setupNewPromise(); }
    }, document.body);
  }
}

export default overhide_wallet;