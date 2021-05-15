// A modal to display iframes and forms on behalf of the library.
class dom_fns {
  resolve = null;
  reject = null;

  constructor() {
    window.addEventListener('message', (e) => {
      if (!e.data || !e.data.event) return;
      switch(e.data.event) {
        case 'oh$-popup-close':
          this.makePopupHidden('user close', true);
          break;
      }
    });    
  }

  // initialize this after all dependencies wired up
  init() {
    this.createPopup();
  }

  // raise oh$-event
  // @param {string} imparterTag
  // @param {string} triggerFor 
  // @param {Object} data - to stringify and sent as event.details.
  raiseEventClick(imparterTag, triggerFor) {
    window.parent.postMessage({event: 'oh$-event', detail: JSON.stringify({
      imparterTag: imparterTag,
      triggerFor: triggerFor,
      click: true
    })});
  }

  // raise oh$-event
  // @param {string} imparterTag
  // @param {string} triggerFor 
  // @param {Object} data - to stringify and sent as event.details.
  raiseEvent(imparterTag, triggerFor, data) {
    window.parent.postMessage({event: 'oh$-event', detail: JSON.stringify({
      ...data,
      imparterTag: imparterTag,
      triggerFor: triggerFor
    })});    
  }

  // promise used for popups and resolutions via oh-ledger-* messages.
  setupNewPromise() {
    console.assert(!this.resolve, 'oh-popup promise being set but already set when calling setupNewPromise(..)');
    return new Promise((rs, rj) => {
      this.resolve = rs;
      this.reject = rj;
    });    
  }

  // Setup the iframe source
  setFrame(src, widthEm=80, heightEm=60) {
    const frame = document.getElementById('oh-ledger-iframe');
    frame.setAttribute('src', src);
    frame.style.display='block';    
    const container = document.getElementById('oh-popup-container-div');
    container.style.width=`${widthEm}em`;
    container.style.height=`${heightEm}em`;
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
    document.getElementById('oh-ledger-iframe').style.display='none';
  }

  createPopup() {
    var popup = document.createElement('div');
    popup.setAttribute('id','oh-popup-container');
    popup.style.display='none';
    popup.innerHTML = `
      <div id="oh-popup-container-div">
        <a href="#" title="Close" id="oh-popup-close" onclick="window.parent.postMessage({event: 'oh$-popup-close'}); return false;">X</a>
        <iframe id="oh-ledger-iframe"></iframe>
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
      #oh-popup-container-div {
          max-width: 80vw;
          max-height: 75vh;
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

      #oh-ledger-iframe {
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
      } else {
        setTimeout(attach, 100);
      };
    };
    attach();
  }  
}

export default dom_fns;