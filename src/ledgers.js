import Web3 from 'web3';
import {Accounts} from 'web3-eth-accounts';

//     ledgers.js 
//     https://ohledger.com
//     (c) 2019 Overhide Inc.
//     ledgers.js may be freely distributed under the MIT license.

/**
 * @namespace oh$
 * @description 
 * 
 * #### REFERENCES
 * 
 * Library code: https://github.com/overhide/ledgers.js/blob/master/ledgers.js.
 *
 * Repository for this library is https://github.com/overhide/ledgers.js.
 * 
 * The repository contains a demo app of this library working in conjunction with the *overhide* Ethereum remuneration
 * provider (Rinkeby testnet -- https://rinkeby.ethereum.overhide.io) and the *overhide-ledger* (test environment -- https://test.ohledger.com)
 * 
 * #### ABOUT
 * 
 * JavaScript library to be used in-browser and interrogate *overhide* remuneration providers as to validity
 * of ledger credentials and transactions involving these credentials.
 * 
 * The goal of the library and the *overhide* remuneration providers is to ease using of all types of ledgers for
 * authentication (I am who I say) and authorization (paid access tiers).
 * 
 * The library leverages injected currency wallets where it can, and exposes functions to work with *loose* currencies 
 * (without wallets) where it cannot.
 * 
 * The library exports the `oh$` object for use as a module when bundling.
 * 
 * ```
 * import oh$ from "ledgers.js";
 * oh$.onWalletChange = ...
 * ```
 * 
 * Once bundled with its dependencies--the library can be loaded straight into your HTML and accessed by its `oh$` 
 * property from the browser's `window` object:
 * 
 * ```
 * <script src="./dist/ledgers.js"></script>
 * <script>
 *   oh$.onWalletChange = ...
 * </script>
 * ```
 * 
 * #### IMPARTERS
 * 
 * The library works with a concept of *imprater* tags.  Wallets impart credentials, signatures, and transactions.  For
 * *loose change*--where no wallet exists--the library can be interrogated as to which entities should be set by the 
 * user (can* functions); causing the entities to be imparted back to the user in a common code flow.  
 * 
 * The imparter tags are a simple naming convention.  For example if multiple Ethereum wallet APIs were imparting data 
 * they  would be individually tagged with a prefix "eth" and a dashed suffix.  No suffix indicates a *loose change*
 * imparter:
 * 
 * - eth-web3
 * - eth-?
 * 
 * Similarly for *overhide-ledger*, the prefix is "ohledger", the suffix won't be attached on the *loose change* version 
 * and will be suffixed on the *web3* walleted version:
 * 
 * - ohledger
 * - ohledger-web3
 * 
 * The following sections cover special notes on each imparter.  The library adheres to these notes.
 * 
 * ##### eth-web3
 * 
 * Ethereum addresses are 20 bytes: 42 character 'hex' strings prefixed with '0x'.
 * 
 * Ethereum secret keys for signing addresses are 32 bytes: 66 character 'hex' strings prefixed with '0x'.
 * 
 * Ethereum networks names are:
 * 
 * * main
 * * kovan
 * * rinkeyby
 * * ropsten
 * 
 * The denomination for amounts is the Wei
 * 
 * ##### ohledger, ohledger-web3
 * 
 * Addresses and secret keys use Ethereum format.
 * 
 * Addresses are 20 bytes: 42 character 'hex' strings prefixed with '0x'.
 * 
 * Secret keys for signing addresses are 32 bytes: 66 character 'hex' strings prefixed with '0x'.
 * 
 * Network tuples consist of a 'currency' as a three letter ISO fiat currency code and a 'mode'.  The supported
 * 'currency' names are:
 * 
 * * 'USD' (cents)
 * 
 * The denomination in brackets is not part of the name and is the denomination for amounts.
 * 
 * Note: at this point only USD are supported.  If there is a need, and *overhide-ledger* instances in currencies
 * other than USD come online, we'll revisit this.
 *
 * An 'ohledger' mode is on of 'prod' or 'test'
 * 
 */
(function() {

  var root = typeof self == 'object' && self.self === self && self ||
    typeof global == 'object' && global.global === global && global ||
    this ||
    {};

  root.oh$ = {
  /**
   * @property {function(string,boolean)} onWalletChange 
   * @description
   *   Handler registered by user; called when wallets' state changes.
   * 
   *   The library passes in the imparter tag undergoing change and a boolean indicating 'true' if wallet available
   *   or 'false.
   * 
   *   In user code:
   * 
   *   ```
   *   oh$.onWalletChange = (imparterTag, isPresent) => console.log(`wallet for ${imparterTag} is available:${isPresent}`);
   *   ```
   */
    onWalletChange: null,

  /**
   * @property {function(string,boolean)} onWalletPopup
   * @description
   *   Handler registered by user; called when wallet is expected to popup.  Useful in case user wants to react to popup in UI.
   * 
   *   The library passes in the imparter tag causing the popup.
   * 
   *   In user code:
   * 
   *   ```
   *   oh$.onWalletPopup = (imparterTag) => console.log(`wallet for ${imparterTag} popped`);
   *   ```
   */
    onWalletPopup: null,

  /**
   * @property {function(string,Object)} onCredentialsUpdate
   * @description
   *   Handler registered by user; called when an credentials change for one of the tracked imparters.
   * 
   *   Only called when credentials are valid as per imparter: ready to be used for signing, transacting.
   *
   *   First string is the imparter tag, second object are the new credentials: imparter currency specific.
   * 
   *   The new credentials object will conform to the following:
   * 
   *   | imparter tag | credentials object |
   *   | --- | --- |
   *   | eth-web3 | `{address:..}` |
   *   | ohledger | `{address:..,secret:..}` |
   *   | ohledger-web3 | `{address:..}` |
   *
   *   In user code:
   *
   *   ```
   *   oh$.onAddressUpdate = (imparterTag, creds) => {
   *     if (imparterTag === 'eth-web3') console.log(`new address for ${imparterTag} is:${creds.address}`);
   *   }
   *   ```
   */
    onCredentialsUpdate: null,

  /**
   * @property {function(string,Object)} onNetworkChange
   * @description
   *   Handler registered by user; called when the network changes for a particular imparter tag.
   * 
   *   For example for "eth0" the network could changed from "main" to "rinkeby".  
   * 
   *   The first string is the imparter tag, second object is the new network details: imparter currency specific.
   *
   *   The new credentials object will conform to the following:
   *
   *   | imparter tag | credentials object |
   *   | --- | --- |
   *   | eth-web3 | `{name:('main'|'rinkeby'|'kovan').., uri:..}` |
   *   | ohledger | `{currency:'USD',mode:('prod'|'test'), uri:..}` |
   *   | ohledger-web3 | `{currency:'USD',mode:('prod'|'test'), uri:..}` |
   *
   *   In user code:
   *
   *   ```
   *   oh$.onNetworkChange = (imparterTag, details) => {
   *     if (imparterTag === 'eth-web3') console.log(`new network selected for ${imparterTag} is:${details.name}`);
   *     if (imparterTag === /ohledger/.test(imparterTag)) console.log(`working in currency: ${details.currency}`);
   *   }
   *   ```
   */
    onNetworkChange: null,

    /**
     * @namespace oh$
     * @function getImparterTags
     * @description
     *   Retrieves all imparter tags injected by wallets and statically available from the library.
     * @returns {Array} of strings: the imparter tags available
     */
    getImparterTags: getImparterTags,

    /**
     * @namespace oh$
     * @function canSetCredentials
     * @description
     *   Interrogate whether the imparter tag can have credentials set by the user: or does the wallet control it
     *   exclusively.
     * 
     *   Only the following imparter(s) will return 'true':
     * 
     *   - ohledger
     * 
     * @param {string} imparterTag
     * @returns {boolean} 'true' if particular imparter tag can have credentials set.
     */
    canSetCredentials: canSetCredentials,

    /**
     * @namespace oh$
     * @function canGenerateCredentials
     * @description
     *   Interrogate whether the imparter tag can have credentials generated by the user: or does the wallet control it
     *   exclusively.
     *
     *   Only the following imparter(s) will return 'true':
     *
     *   - ohledger
     *
     * @param {string} imparterTag
     * @returns {boolean} 'true' if particular imparter tag can have credentials generated.
     */
    canGenerateCredentials: canGenerateCredentials,

    /**
     * @namespace oh$
     * @function canChangeNetwork
     * @description
     *   Interrogate whether the imparter tag can have network changed by the user via oh$: or does the wallet control it
     *   exclusively.
     *
     *   Only the following imparter(s) will return 'true':
     *
     *   - ohledger
     *   - ohledger-web3
     *
     * @param {string} imparterTag
     * @returns {boolean} 'true' if particular imparter tag can have networks changed via oh$.
     */
    canChangeNetwork: canChangeNetwork,

    /**
     * @namespace oh$
     * @function generateCredentials
     * @description
     *   For imparters that can have credentials generated, generates them.  
     * 
     *   This setter calls `oh$.onCredentialsUpdate` when successful.
     * @param {string} imparterTag
     * @param {Object} options - imparter specific generation options, if any.
     * 
     *   The options objects are as follows:
     * 
     *   | imparter tag | credentials object |
     *   | --- | --- |
     *   | eth-web3 | N/A |
     *   | ohledger | null |
     *   | ohledger-web3 | N/A |
     *
     * @returns {Promise} representing a 'true' if success else 'false'; also calls `oh$.onCredentialsUpdate` on success
     */
    generateCredentials: generateCredentials,

    /**
     * @namespace oh$
     * @function setCredentials
     * @description
     *   For imparters that can have credentials set, sets them.  
     * 
     *   This setter calls `oh$.onCredentialsUpdate` when successful.
     * @param {string} imparterTag
     * @param {Object} credentials - credentials object of imparter specific parameters to set.
     * 
     *   The credentials objects are as follows:
     * 
     *   | imparter tag | credentials object |
     *   | --- | --- |
     *   | eth-web3 | N/A |
     *   | ohledger | `{address:..,secret:..}` |
     *   | ohledger-web3 | N/A |
     *
     * @returns {Promise} representing a 'true' if success else 'false'; also calls `oh$.onCredentialsUpdate` on success
     */
    setCredentials: setCredentials,

    /**
     * @namespace oh$
     * @function setNetwork
     * @description
     *   For imparters that can have networks changed via oh$, changes it.  
     * 
     *   This setter calls `oh$.onNetworkChange` when successful.
     * @param {string} imparterTag
     * @param {Object} details - network details object of imparter specific parameters to set.
     * 
     *   The network details objects are as follows:
     * 
     *   | imparter tag | credentials object |
     *   | --- | --- |
     *   | eth-web3 | N/A |
     *   | ohledger | `{currency:'USD', mode:'prod'|'test'}` |
     *   | ohledger-web3 | `{currency:'USD', mode:'prod'|'test'}` |
     *
     * @returns {Promise} representing a 'true' if success else 'false'; also calls `oh$.onNetworkChange` on success
     */
    setNetwork: setNetwork,

    /**
     * @namespace oh$
     * @function getOverhideRemunerationAPIUri
     * @description
     *   Based on current network set returns the *overhide* remuneration API URI configured in the library.
     * @param {string} imparterTag
     * @returns {string} the URI.
     */
    getOverhideRemunerationAPIUri: getOverhideRemunerationAPIUri,

    /**
     * @namespace oh$
     * @function getTally
     * @description
     *   Retrieve a tally of all transactions on the imparter's ledger--perhaps within a date range.
     * @param {string} imparterTag
     * @param {Date} since - date to start tally since: date of oldest transaction to include.  No restriction if 'null'.
     * @param {Object} recepient - imparter specific object describing recipient of transactions to tally for.
     *
     *   Recipient objects are as per:
     *
     *   | imparter tag | recipient object |
     *   | --- | --- |
     *   | eth-web3 | `{address:..}` |
     *   | ohledger | `{address:..}` |
     *   | ohledger-web3 | `{address:..}` |
     *
     * @returns {Promise} with the tally value in imparter specific currency
     */
    getTally: getTally,

    /**
     * @namespace oh$
     * @function getTransactions
     * @description
     *   Retrieve transactions on the imparter's ledger, perhaps within a date range, from credentials set against 
     *   imparter to a recipient
     * @param {string} imparterTag
     * @param {Date} since - date to start tally since: date of oldest transaction to include.  No restriction if 'null'.
     * @param {Object} recepient - imparter specific object describing recipient of transactions to tally for.
     *
     *   Recipient objects are as per:
     *
     *   | imparter tag | recipient object |
     *   | --- | --- |
     *   | eth-web3 | `{address:..}` |
     *   | ohledger | `{address:..}` |
     *   | ohledger-web3 | `{address:..}` |
     *
     * @returns {Promise} with the transactions: `[{"transaction-value":..,"transaction-date":..},..]`
     */
    getTransactions: getTransactions,

    /**
     * @namespace oh$
     * @function isOnLedger
     * @description
     *   Determine if current credentials have some transaction on the imparter's ledger: transaction can be to anyone.
     * 
     *   Intent is to validate beyond just a valid address.  To validate the address has been used.
     * 
     *   Call may trigger `oh$.onWalletPopup`.
     * @param {string} imparterTag
     * @returns {Promise} with 'true' or 'false'; may call `oh$.onWalletPopup`
     */
    isOnLedger: isOnLedger,

    /**
     * @namespace oh$
     * @function sign
     * @description
     *   Sign using the provided message using the credentials set against the specific imparter.
     * 
     *   Note: wallet might pop up a dialog upon this call, consider that in your UX flow.
     * 
     *   Call may trigger `oh$.onWalletPopup`.
     * @param {string} imparterTag
     * @param {string} message - to sign
     * @returns {Promise} with the signature; may call `oh$.onWalletPopup`
     */
    sign: sign,

    /**
     * @namespace oh$
     * @function createTransaction
     * @description
     *   Create a transaction on the imparter's ledger.
     * 
     *   Call may trigger `oh$.onWalletPopup`; wallet might pop up a dialog upon this call, consider that in your UX flow.
     * @param {string} imparterTag
     * @param {number} amount
     * @param {string} to - address of recipient
     * @param {Object} options - other options required for the specific imparter.
     * 
     *   The options objects are as follows:
     *
     *   | imparter tag | credentials object |
     *   | --- | --- |
     *   | eth-web3 | null |
     *   | ohledger | {message:.., signature:..} |
     *   | ohledger-web3 | {message:.., signature:..} |
     * 
     *   If *message* and *signature* are provided they are used instead of oh$ asking for wallet to resign message.
     *
     * @returns {Promise} of a 'true' for success or an Error; may call `oh$.onWalletPopup`
     */
    createTransaction: createTransaction    
  };

  const WALLET_CHECK_INTERVAL_MS = 500;

  const ETH_WEB3_IMPARTER_TAG = 'eth-web3';
  const OHLEDGER_IMPARTER_TAG = 'ohledger'
  const OHLEDGER_WEB3_IMPARTER_TAG = 'ohledger-web3'

  var imparterTags = [OHLEDGER_IMPARTER_TAG];

  var data = {
    ETH_WEB3_IMPARTER_TAG: {
      walletAddress: null,
      network: null,
      remuneration_uri: {
        'main':'https://ethereum.overhide.io',
        'rinkeby':'https://rinkeby.ethereum.overhide.io'
      }
    },
    OHLEDGER_IMPARTER_TAG: {
      oh_ledger_transact_fn: {
        'prod': null,
        'test': null
      },
      address: null,
      secret: null,
      mode: 'test',
      remuneration_uri: {
        'prod': 'https://ohledger.com/v1',
        'test': 'https://test.ohledger.com/v1'
      }
    },
    OHLEDGER_WEB3_IMPARTER_TAG: {
      oh_ledger_transact_fn: {
        'prod': null,
        'test': null
      },
      walletAddress: null,
      mode: 'test',
      remuneration_uri: {
        'prod': 'https://ohledger.com/v1',
        'test': 'https://test.ohledger.com/v1'
      }
    }
  }

  var eth_accounts = new Accounts('http://localhost:8545');

  createPopup();
  detectWeb3Wallet();

  /**
   * Setup window.web3 to be the wallet's if available or offline if not (just for signing).
   * 
   * Sets up a timer to check for wallet being logged in and address changes.
   * 
   * @ignore
   */
  function detectWeb3Wallet() {    
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
      if (currentAddress !== data.ETH_WEB3_IMPARTER_TAG.walletAddress) {
        let imparterTagIndex = imparterTags.findIndex(v => v === ETH_WEB3_IMPARTER_TAG);
        if (imparterTagIndex && !currentAddress) {
          imparterTags.splice(imparterTagIndex,1);
        } else if (!imparterTagIndex && currentAddress) {
          imparterTags.push(ETH_WEB3_IMPARTER_TAG);
          imparterTags.push(OHLEDGER_WEB3_IMPARTER_TAG);
        }
        data.ETH_WEB3_IMPARTER_TAG.walletAddress = currentAddress;
        data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress = currentAddress;
        if (root.oh$.onWalletChange) {
          root.oh$.onWalletChange(ETH_WEB3_IMPARTER_TAG,!!currentAddress);
          root.oh$.onWalletChange(OHLEDGER_WEB3_IMPARTER_TAG, !!currentAddress);
        }
        if (root.oh$.onCredentialsUpdate && currentAddress) {
          root.oh$.onCredentialsUpdate(ETH_WEB3_IMPARTER_TAG, {address:currentAddress});
          root.oh$.onCredentialsUpdate(OHLEDGER_WEB3_IMPARTER_TAG, { address: currentAddress });
        }
      }
      if (currentNetwork !== data.ETH_WEB3_IMPARTER_TAG.network) {
        if (root.oh$.onNetworkChange) {
          root.oh$.onNetworkChange(ETH_WEB3_IMPARTER_TAG, {name:currentNetwork, uri: data.ETH_WEB3_IMPARTER_TAG.remuneration_uri[currentNetwork]});
        }
        data.ETH_WEB3_IMPARTER_TAG.network = currentNetwork;
      }
    }
  } 

  function getImparterTags() {
    return imparterTags;
  }

  function canSetCredentials(imparterTag) {
    return imparterTag === OHLEDGER_IMPARTER_TAG;
  }

  function canGenerateCredentials(imparterTag) {
    return imparterTag === OHLEDGER_IMPARTER_TAG;
  }

  function canChangeNetwork(imparterTag) {
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
      case OHLEDGER_WEB3_IMPARTER_TAG:
        return true;
      default:
        return false;
    }
  }

  async function setCredentials(imparterTag, credentials) {
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
        if (!('address' in credentials)) throw new Error("'address' must be passed in");
        if (!('secret' in credentials)) throw new Error("'secret' must be passed in");
        data.OHLEDGER_IMPARTER_TAG.address = credentials.address;
        data.OHLEDGER_IMPARTER_TAG.secret = credentials.secret;
        try {
          if (!(eth_accounts.recover(eth_accounts.sign('test message', credentials.secret)).toLowerCase() == credentials.address.toLowerCase())) {
            throw new Error("'secret' not valid for 'address");
          }
        } catch (err) {
          throw new Error("'secret' not valid for 'address");
        }        
        if (root.oh$.onCredentialsUpdate) root.oh$.onCredentialsUpdate(OHLEDGER_IMPARTER_TAG, { address: credentials.address, secret: credentials.secret });
        return true;
      default:
        return false;
    }
  }

  async function generateCredentials(imparterTag, options) {
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
        let res = eth_accounts.create();
        data.OHLEDGER_IMPARTER_TAG.address = res.address;
        data.OHLEDGER_IMPARTER_TAG.secret = res.privateKey;
        if (root.oh$.onCredentialsUpdate) root.oh$.onCredentialsUpdate(OHLEDGER_IMPARTER_TAG,{address:res.address,secret:res.privateKey});
        return true;
      default:
        return false;
    }
  }

  async function setNetwork(imparterTag, details) {
    if (ETH_WEB3_IMPARTER_TAG == imparterTag) return false;
    if (!('currency' in details)) throw new Error("'currency' must be passed in");
    if (!('mode' in details)) throw new Error("'mode' must be passed in");
    details.currency = details.currency.toUpperCase();
    details.mode = details.mode.toLowerCase();
    if (details.currency !== 'USD') throw new Error("'currency' must be 'USD'");
    if (details.mode !== 'prod' && details.mode !== 'test') throw new Error("'mode' must be 'prod' or 'test'");
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
        data.OHLEDGER_IMPARTER_TAG.mode = details.mode;
        if (root.oh$.onNetworkChange) root.oh$.onNetworkChange(OHLEDGER_IMPARTER_TAG, { currency: 'USD', mode: details.mode, uri: data.OHLEDGER_IMPARTER_TAG.remuneration_uri[details.mode] });
        return true;
      case OHLEDGER_WEB3_IMPARTER_TAG:
        data.OHLEDGER_WEB3_IMPARTER_TAG.mode = details.mode;
        if (root.oh$.onNetworkChange) root.oh$.onNetworkChange(OHLEDGER_WEB3_IMPARTER_TAG, { currency: 'USD', mode: details.mode, uri: data.OHLEDGER_WEB3_IMPARTER_TAG.remuneration_uri[details.mode]});
        return true;
      default:
        return false;
    }
  }

  function getOverhideRemunerationAPIUri(imparterTag) {
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:        
        if (!data.OHLEDGER_IMPARTER_TAG.mode) throw new Error("network 'mode' must be set, use setNetwork");
        return data.OHLEDGER_IMPARTER_TAG.remuneration_uri[data.OHLEDGER_IMPARTER_TAG.mode];
      case OHLEDGER_WEB3_IMPARTER_TAG:
        if (!data.OHLEDGER_WEB3_IMPARTER_TAG.mode) throw new Error("network 'mode' must be set, use setNetwork");
        return data.OHLEDGER_WEB3_IMPARTER_TAG.remuneration_uri[data.OHLEDGER_WEB3_IMPARTER_TAG.mode];
      case ETH_WEB3_IMPARTER_TAG:
        return data.ETH_WEB3_IMPARTER_TAG.remuneration_uri[data.ETH_WEB3_IMPARTER_TAG.network];      
      default:
        return null;
    }
  }

  async function getTally(imparterTag, recipient, date) {
    return (await getTxs(imparterTag, recipient, date, true)).tally;
  }

  async function getTransactions(imparterTag, recipient, date) {
    return (await getTxs(imparterTag, recipient, date, false)).transactions;
  }

  async function getTxs(imparterTag, recipient, date, tallyOnly) {
    if (date && !(date instanceof Date)) throw new Error("'date' must be a Date is passed in");
    if (!('address' in recipient)) throw new Error("'address' required in recipient");
    let to = recipient.address;
    let uri = getOverhideRemunerationAPIUri(imparterTag);
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
        if (!data.OHLEDGER_IMPARTER_TAG.mode) throw new Error("network 'mode' must be set, use setNetwork");
        if (!data.OHLEDGER_IMPARTER_TAG.address) throw new Error("from 'address' not set: use setCredentials");
        var from = data.OHLEDGER_IMPARTER_TAG.address;
        break;
      case OHLEDGER_WEB3_IMPARTER_TAG:
        if (!data.OHLEDGER_WEB3_IMPARTER_TAG.mode) throw new Error("network 'mode' must be set, use setNetwork");
        if (!data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
        var from = data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress;
        break;
      case ETH_WEB3_IMPARTER_TAG:
        if (!data.ETH_WEB3_IMPARTER_TAG.network) throw new Error("no network for imparter tag");
        if (!data.ETH_WEB3_IMPARTER_TAG.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
        var from = data.ETH_WEB3_IMPARTER_TAG.walletAddress;
        break;
      default:
        throw new Error('unsupported imparter tag');
    }
    if (!uri) throw new Error('no uri for request, unsupported network selected in wallet?');
    let since = '';
    if (date) {
      since = `&since=${date.toISOString()}`;
    }
    return await fetch(`${uri}/get-transactions/${from}/${to}?tally-only=${tallyOnly ? 'true' : 'false'}${since}`)
      .then(res => res.json())
      .catch(e => {
        throw String(e)
      });
  }

  // raise oh$-event
  // @param {string} imparterTag
  // @param {string} triggerFor 
  // @param {Object} data - to stringify and sent as event.details.
  function raiseEventClick(imparterTag, triggerFor) {
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
  function raiseEvent(imparterTag, triggerFor, data) {
    window.parent.document.dispatchEvent(new CustomEvent('oh$-event', {detail: JSON.stringify({
      ...data,
      imparterTag: imparterTag,
      triggerFor: triggerFor
    })}));    
  }

  async function isOnLedger(imparterTag) {
    let uri = getOverhideRemunerationAPIUri(imparterTag);
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
        if (!data.OHLEDGER_IMPARTER_TAG.mode) throw new Error("network 'mode' must be set, use setNetwork");
        if (!data.OHLEDGER_IMPARTER_TAG.address) throw new Error("from 'address' not set: use setCredentials");
        var from = data.OHLEDGER_IMPARTER_TAG.address;
        break;
      case OHLEDGER_WEB3_IMPARTER_TAG:
        if (!data.OHLEDGER_WEB3_IMPARTER_TAG.mode) throw new Error("network 'mode' must be set, use setNetwork");
        if (!data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
        var from = data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress;
        break;
      case ETH_WEB3_IMPARTER_TAG:
        if (!data.ETH_WEB3_IMPARTER_TAG.network) throw new Error("no network for imparter tag");
        if (!data.ETH_WEB3_IMPARTER_TAG.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
        var from = data.ETH_WEB3_IMPARTER_TAG.walletAddress;
        break;
      default:
        throw new Error('unsupported imparter tag');
    }
    if (!uri) throw new Error('no uri for request, unsupported network selected in wallet?');
    let message = 'verify ownership of address by signing';
    let signature = await sign(imparterTag, message);
    return await fetch(`${uri}/is-signature-valid`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        signature: btoa(signature),
        message: btoa(message),
        address: from
      })
    })
      .then((result) => {
        if (result.status == 200) {
          return true;
        } else {
          return false;
        }
      })
      .catch(e => {
        throw String(e)
      });
  }

  async function sign(imparterTag, message) {
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
        if (!data.OHLEDGER_IMPARTER_TAG.secret) throw new Error(`credentials for imparter ${OHLEDGER_IMPARTER_TAG} not set`);
        return eth_accounts.sign(message, data.OHLEDGER_IMPARTER_TAG.secret).signature;
      case OHLEDGER_WEB3_IMPARTER_TAG:
        if (!data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress) throw new Error(`imparter ${OHLEDGER_WEB3_IMPARTER_TAG} not active`);
        if (root.oh$.onWalletPopup) root.oh$.onWalletPopup(OHLEDGER_WEB3_IMPARTER_TAG);
        return (await window.web3.eth.personal.sign(message, data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress, ''));
      case ETH_WEB3_IMPARTER_TAG:
        if (!data.ETH_WEB3_IMPARTER_TAG.walletAddress) throw new Error(`imparter ${ETH_WEB3_IMPARTER_TAG} not active`);
        if (root.oh$.onWalletPopup) root.oh$.onWalletPopup(ETH_WEB3_IMPARTER_TAG);
        return (await window.web3.eth.personal.sign(message, data.ETH_WEB3_IMPARTER_TAG.walletAddress, ''));
      default:
        return null;
    }
  }

  async function createTransaction(imparterTag, amount, to, options) {
    if (amount == 0) {
      if (await isOnLedger(imparterTag)) {
        return true;
      }
    }
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
        if (!data.OHLEDGER_IMPARTER_TAG.mode) throw new Error("network 'mode' must be set, use setNetwork");
        if (!data.OHLEDGER_IMPARTER_TAG.address) throw new Error("from 'address' not set: use setCredentials");
        var from = data.OHLEDGER_IMPARTER_TAG.address;
        break;
      case OHLEDGER_WEB3_IMPARTER_TAG:
        if (!data.OHLEDGER_WEB3_IMPARTER_TAG.mode) throw new Error("network 'mode' must be set, use setNetwork");
        if (!data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
        var from = data.OHLEDGER_WEB3_IMPARTER_TAG.walletAddress;
        break;
      case ETH_WEB3_IMPARTER_TAG:
        if (!data.ETH_WEB3_IMPARTER_TAG.network) throw new Error("no network for imparter tag");
        if (!data.ETH_WEB3_IMPARTER_TAG.walletAddress) throw new Error("from 'walletAddress' not set: use wallet");
        var from = data.ETH_WEB3_IMPARTER_TAG.walletAddress;
        break;
      default:
        throw new Error('unsupported imparter tag');
    }
    switch (imparterTag) {
      case OHLEDGER_IMPARTER_TAG:
      case OHLEDGER_WEB3_IMPARTER_TAG:
        if (amount == 0) {
          if ('message' in options && 'signature' in options) {
            message = options.message;
            signature = options.signature;
          } else {
            var message = `verify ownership of address by signing on ${new Date().toLocaleString()}`;
            var signature = await sign(imparterTag, message);
          }
          await showOhLedgerGratisIframeUri(imparterTag, from, signature, message);
        } else {
          let eventPromise = setupNewPromise();
          data.OHLEDGER_IMPARTER_TAG.oh_ledger_transact_fn[data.OHLEDGER_IMPARTER_TAG.mode](amount, from, to);
          await eventPromise;
        }
        break;
      case ETH_WEB3_IMPARTER_TAG:
        if (root.oh$.onWalletPopup) root.oh$.onWalletPopup(ETH_WEB3_IMPARTER_TAG);
        await web3.eth.sendTransaction({from:from, to:to, value: amount});
        break;
      default:
        throw new Error('unsupported imparter tag');
    }
    return true;
  }

  var resolve = null;
  var reject = null;

  // promise used for popups and resolutions via oh-ledger-* messages.
  function setupNewPromise() {
    console.assert(!resolve, 'oh-popup promise being set but already set when calling setupNewPromise(..)');
    return new Promise((rs, rj) => {
      resolve = rs;
      reject = rj;
    });    
  }

  // make popup visible to be hidden with makePopupHidden
  function makePopupVisible() {
    var popup = document.getElementById('oh-popup-container');
    popup.style.display='block';
    return setupNewPromise();
  }

  function makePopupHidden(params, isError) {
    var popup = document.getElementById('oh-popup-container');
    hideAllPopupContents();
    popup.style.display='none';
    console.assert(resolve, 'oh-popup promise not set yet calling makePopupHidden(..)');
    if (isError) reject(params)
    else resolve(params);
    resolve = null;
    reject = null;
  }

  window.addEventListener('message', (e) => {
    if (e.data && e.data.event === 'oh-ledger-ok') {
      makePopupHidden(e.data.detail);
    } else if (e.data && e.data.event === 'oh-ledger-error') {
      makePopupHidden(e.data.detail, true);
    }
  }, false);

  function hideAllPopupContents() {
    document.getElementById('oh-ledger-gratis-iframe').style.display='none';
  }

  async function showOhLedgerGratisIframeUri(imparterTag, from, signature, message) {
    hideAllPopupContents();
    let uri = getOverhideRemunerationAPIUri(imparterTag);
    var frame = document.getElementById('oh-ledger-gratis-iframe');
    frame.setAttribute('src', `${uri}/gratis.html?address=${from}&signature=${signature}&message=${message}`);
    frame.style.display='block';    
    await makePopupVisible();
  }

  function createPopup() {
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
        loadOhLedgerTransactFns();
      } else {
        setTimeout(attach, 100);
      };
    };
    attach();
  }

  window.document.addEventListener('oh$-popup-close', (e) => {
    makePopupHidden('user close', true);
  });

  // https://stackoverflow.com/a/31374433
  function loadJS(url, implementationCode, location) {
    //url is URL of external file, implementationCode is the code
    //to be called from the file, location is the location to 
    //insert the <script> element

    var scriptTag = document.createElement('script');
    scriptTag.src = url;

    scriptTag.onload = implementationCode;
    scriptTag.onreadystatechange = implementationCode;

    location.appendChild(scriptTag);
  };

  function loadOhLedgerTransactFns() {
    // load prod ohledger transact fn
    loadJS(`${data.OHLEDGER_IMPARTER_TAG.remuneration_uri.prod}/transact.js`, () => {
      data.OHLEDGER_IMPARTER_TAG.oh_ledger_transact_fn.prod = oh_ledger_transact;
      data.OHLEDGER_WEB3_IMPARTER_TAG.oh_ledger_transact_fn.prod = oh_ledger_transact;
    }, document.body);

    // load test ohledger transact fn
    loadJS(`${data.OHLEDGER_IMPARTER_TAG.remuneration_uri.test}/transact.js`, () => {
      data.OHLEDGER_IMPARTER_TAG.oh_ledger_transact_fn.test = oh_ledger_transact;
      data.OHLEDGER_WEB3_IMPARTER_TAG.oh_ledger_transact_fn.test = oh_ledger_transact;
    }, document.body);
  }

  return root.oh$;
})();

const oh$ = {a: () => true, b: () => false};

export default oh$;