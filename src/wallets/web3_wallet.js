import Web3 from 'web3';
import eth_web3 from '../imparters/eth-web3.js';
import ohledger_web3 from '../imparters/ohledger-web3.js';

const WALLET_CHECK_INTERVAL_MS = 500;

class web3_wallet {
  eth_accounts = (new Web3('http://localhost:8545')).eth.accounts;
  walletAddress = null;
  network = null;

  networkChangeDelegates = [];

  constructor(addTag, removeTag, fire) {
    this.addTag = addTag;
    this.removeTag = removeTag;
    this.fire = fire;
  }

  /**
   * Setup window.web3 to be the wallet's if available or offline if not (just for signing).
   * 
   * Sets up a timer to check for wallet being logged in and address changes.
   * 
   * @ignore
   */
  detectWeb3Wallet() {    
    if (!window.ethereum) return;
 
    // Modern dapp browsers...
    (async () => {
      try {
        await window.ethereum.enable();
        window.web3 = new Web3(window.ethereum);
      } catch (e) {/*noop*/ }

      await detectWalletCb();

      setInterval(async function () {
        await detectWalletCb();
      }, WALLET_CHECK_INTERVAL_MS);
    })();

    var detectWalletCb = async () => {
      try {
        var currentAccounts = await window.web3.eth.getAccounts();
        var currentAddress = (currentAccounts && currentAccounts.length > 0) ? currentAccounts[0] : null;
        var currentNetwork = (await window.web3.eth.net.getNetworkType());
      } catch (e) {/*noop*/}
      if (currentNetwork !== this.network) {
        this.network = currentNetwork;
        this.networkChangeDelegates.forEach(d => d(this.network));        
      }
      if (currentAddress !== this.walletAddress) {
        if (currentAddress) { /* add imparters */
          this.addTag(eth_web3.tag);
          this.addTag(ohledger_web3.tag);
        } else { /* remove imparters */
          this.removeTag(eth_web3.tag);
          this.removeTag(ohledger_web3.tag);
        } 
        this.walletAddress = currentAddress;
        this.fire('onWalletChange', { imparterTag: eth_web3.tag, isPresent: !!currentAddress });
        this.fire('onWalletChange', { imparterTag: ohledger_web3.tag, isPresent: !!currentAddress });
        if (currentAddress) {
          this.fire('onCredentialsUpdate', { imparterTag: eth_web3.tag, address: currentAddress });
          this.fire('onCredentialsUpdate', { imparterTag: ohledger_web3.tag, address: currentAddress });
        }
      }
    }
  } 
}

export default web3_wallet;