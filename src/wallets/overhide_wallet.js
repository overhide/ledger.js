class overhide_wallet {
  resolve = null;
  reject = null;

  oh_ledger_transact_fn = {
    'prod': null,
    'test': null
  };

  remuneration_uri = {
    'prod': 'https://ledger.overhide.io/v1',
    'test': 'https://test.ledger.overhide.io/v1'
  }

  constructor() {
    window.addEventListener('message', (e) => {
      if (e.data && e.data.event === 'oh-ledger-ok') {
        this.makePopupHidden(e.data.detail);
      } else if (e.data && e.data.event === 'oh-ledger-error') {
        this.makePopupHidden(e.data.detail, true);
      }
    }, false);

    window.document.addEventListener('oh$-popup-close', (e) => {
      this.makePopupHidden('user close', true);
    });    
  }

  // raise oh$-event
  // @param {string} imparterTag
  // @param {string} triggerFor 
  // @param {Object} data - to stringify and sent as event.details.
  raiseEventClick(imparterTag, triggerFor) {
    window.parent.document.dispatchEvent(new CustomEvent('oh$-event', {detail: JSON.stringify({
      imparterTag: imparterTag,
      triggerFor: triggerFor,
      click: true
    })}));
  }

  // raise oh$-event
  // @param {string} imparterTag
  // @param {string} triggerFor 
  // @param {Object} data - to stringify and sent as event.details.
  raiseEvent(imparterTag, triggerFor, data) {
    window.parent.document.dispatchEvent(new CustomEvent('oh$-event', {detail: JSON.stringify({
      ...data,
      imparterTag: imparterTag,
      triggerFor: triggerFor
    })}));    
  }

  // promise used for popups and resolutions via oh-ledger-* messages.
  setupNewPromise() {
    console.assert(!this.resolve, 'oh-popup promise being set but already set when calling setupNewPromise(..)');
    return new Promise((rs, rj) => {
      this.resolve = rs;
      this.reject = rj;
    });    
  }

  // make popup visible to be hidden with makePopupHidden
  makePopupVisible() {
    var popup = document.getElementById('oh-popup-container');
    popup.style.display='block';
    return this.setupNewPromise();
  }

  makePopupHidden(params, isError) {
    var popup = document.getElementById('oh-popup-container');
    this.hideAllPopupContents();
    popup.style.display='none';
    console.assert(this.resolve, 'oh-popup promise not set yet calling makePopupHidden(..)');
    if (isError) this.reject(params)
    else this.resolve(params);
    this.resolve = null;
    this.reject = null;
  }

  hideAllPopupContents() {
    document.getElementById('oh-ledger-gratis-iframe').style.display='none';
  }

  async showOhLedgerGratisIframeUri(uri, from, signature, message) {
    this.hideAllPopupContents();
    var frame = document.getElementById('oh-ledger-gratis-iframe');
    frame.setAttribute('src', `${uri}/gratis.html?address=${from}&signature=${signature}&message=${message}`);
    frame.style.display='block';    
    await this.makePopupVisible();
  }

  createPopup() {
    var popup = document.createElement('div');
    popup.setAttribute('id','oh-popup-container');
    popup.style.display='none';
    popup.innerHTML = `
      <div>
        <a href="#" title="Close" id="oh-popup-close" onclick="window.parent.document.dispatchEvent(new CustomEvent('oh$-popup-close',{})); return false;">X</a>
        <iframe id="oh-ledger-gratis-iframe"></iframe>
      </div>
    `;
    var style = document.createElement('style');
    style.innerHTML =`
      #oh-popup-container {
          position: fixed;
          font-family: arial, "lucida console", sans-serif;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 999;
          opacity:1;
          pointer-events: auto;
      }
      #oh-popup-container > div {
          width: 80vw;
          height: 75vh;
          position: relative;
          top: 15vh;
          margin: auto auto;
          padding: 5px 5px 5px 5px;
          background: white;
      }
      #oh-popup-close {
          background: grey;
          color: white;
          line-height: 25px;
          position: absolute;
          right: 2px;
          text-align: center;
          top: 2px;
          width: 24px;
          text-decoration: none;
          font-weight: bold;
      }
      #oh-popup-close:hover {
          background: black;
      }

      #oh-ledger-gratis-iframe {
        display: none;
        border: 0;
        overflow: hidden;
        width: 100%;
        height: 100%;
      }
    `;
    var attach = () => {
      if (document.body) {
        document.body.appendChild(popup);
        document.body.appendChild(style);
        this.loadOhLedgerTransactFns();
      } else {
        setTimeout(attach, 100);
      };
    };
    attach();
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
      this.oh_ledger_transact_fn.prod = (...args) => { fn(...args); return this.setupNewPromise(); }
    }, document.body);

    // load test ohledger transact fn
    this.loadJS(`${this.remuneration_uri.test}/transact.js`, () => {
      const fn = oh_ledger_transact;
      this.oh_ledger_transact_fn.test = (...args) => { fn(...args); return this.setupNewPromise(); }
    }, document.body);
  }
}

export default overhide_wallet;