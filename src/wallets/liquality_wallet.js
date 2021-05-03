import btc_liquality from '../imparters/btc-liquality.js';

const WALLET_CHECK_INTERVAL_MS = 500;

class liquality_wallet {
  walletAddress = null;
  network = null;

  networkChangeDelegates = [];

  constructor(addTag, removeTag, fire) {
    this.addTag = addTag;
    this.removeTag = removeTag;
    this.fire = fire;
  }

  // initialize this after all dependencies wired up
  init() {
    this.detectWallet();
  }

  /**
   * Use window.bitcoin if available.
   * 
   * Sets up a timer to check for wallet being logged in and address changes.
   * 
   * @ignore
   */
  detectWallet() {    
    if (!window.bitcoin) return;
 
    (async () => {
      try {
        await window.bitcoin.enable();
      } catch (e) {/*noop*/ }

      await detectWalletCb();

      setInterval(async function () {
        await detectWalletCb();
      }, WALLET_CHECK_INTERVAL_MS);
    })();

    var detectWalletCb = async () => {
      try {
        var currentAddresses = await bitcoin.request({ method: 'wallet_getAddresses', params: [] })
        var currentAddress = (currentAddresses && currentAddresses.length > 0) ? currentAddresses[0].address : null;
        var currentNetwork = (await bitcoin.request({ method: 'wallet_getConnectedNetwork', params: [] })).name;
      } catch (e) {/*noop*/}
      if (currentNetwork !== this.network) {
        this.network = currentNetwork;
        this.networkChangeDelegates.forEach(d => d(this.network));        
      }
      if (currentAddress !== this.walletAddress) {
        if (currentAddress) { /* add imparters */
          this.addTag(btc_liquality.tag);
        } else { /* remove imparters */
          this.removeTag(btc_liquality.tag);
        } 
        this.walletAddress = currentAddress;
        this.fire('onWalletChange', { imparterTag: btc_liquality.tag, isPresent: !!currentAddress });
        if (currentAddress) {
          this.fire('onCredentialsUpdate', { imparterTag: btc_liquality.tag, address: currentAddress });
        }
      }
    }
  } 
}

export default liquality_wallet;