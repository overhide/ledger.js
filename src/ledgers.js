import dom_fns from './fns/dom_fns';
import eth_web3 from './imparters/eth-web3.js';
import btc_manual from './imparters/btc-manual.js';
import ohledger_web3 from './imparters/ohledger-web3.js';
import ohledger from './imparters/ohledger.js';
import ohledger_social from './imparters/ohledger-social.js';
import web3_wallet from './wallets/web3_wallet.js';
import overhide_wallet from './wallets/overhide_wallet.js';

//     ledgers.js 
//     https://ledger.overhide.io
//     (c) 2021 Overhide LLC, Wyoming, USA
//     ledgers.js may be freely distributed under the MIT license.

/**
 * @namespace oh$
 * @description 
 * 
 * ### REFERENCES
 * 
 * Library code: https://github.com/overhide/ledgers.js/blob/master/dist/ledgers.js.
 *
 * Repository for this library is https://github.com/overhide/ledgers.js.
 * 
 * The above repository contains a demo app of this library working in conjunction with:
 * 
 * - the *overhide* Ethereum remuneration provider (Rinkeby testnet -- https://rinkeby.ethereum.overhide.io) 
 * - the *overhide-ledger* (test environment -- https://test.ledger.overhide.io)
 * - the *overhide* Bitcoin remuneration provider (testnet -- https://test.bitcoin.overhide.io) 
 * 
 * ### ABOUT
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
 * > ---
 * > ```
 * > import oh$ from "ledgers.js";
 * > oh$.enable(token);
 * > oh$.addEventListener('onWalletChange', (e) => {...});
 * > ```
 * > ---
 * 
 * > APIs abstracted by *ledgers.js* require a bearer-token.  The `token` (above) is passed in to `enable` the rest of the library's
 * > functionality.  `oh$.enable(..)` can be called every so often with a refreshed token.
 * >
 * >  A token can be retrieved with a `GET /token` call (see https://token.overhide.io/swagger.html).
 * >
 * > To retrieve tokens please first register for your own API key at https://token.overhide.io/register.
 * 
 * The library can be loaded straight into your HTML (along with pre-requisite `web3.min.js`) and accessed by its `oh$` property from the browser's `window` object:
 * 
 * > ---
 * > ```
 * > <script 
 * >    src="https://cdnjs.cloudflare.com/ajax/libs/web3/1.3.4/web3.min.js" 
 * >    integrity="sha512-TTGImODeszogiro9DUvleC9NJVnxO6M0+69nbM3YE9SYcVe4wZp2XYpELtcikuFZO9vjXNPyeoHAhS5DHzX1ZQ==" 
 * >    crossorigin="anonymous"></script>
 * > <script src="./dist/ledgers.js"></script>
 * > <script>
 * >   oh$.enable(token);
 * >   oh$.addEventListener('onWalletChange', (e) => {...});
 * > </script>
 * > ```
 * > ---
 * 
 * ### IMPARTERS
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
 * - ohledger-social
 * 
 * The *ohledger-social* imparter is to use the *overhide-ledger* with credentials stored online behind a Microsoft or
 * Google social login.  The *overhide-ledger* credentials are not transferred to the client.  They sit in the cloud and
 * are used once a social provider allows it.
 * 
 * Thus far Bitcoin is only supported in manual mode (no Bitcoin wallet injection into target site):
 * 
 * - btc-manual
 * 
 * The following sections cover special notes on each imparter.  The library adheres to these notes.
 * 
 * #### eth-web3
 * 
 * > Ethereum addresses are 20 bytes: 42 character 'hex' strings prefixed with '0x'.
 * > 
 * > Ethereum secret keys for signing addresses are 32 bytes: 66 character 'hex' strings prefixed with '0x'.
 * > 
 * > Ethereum networks names/modes are:
 * >
 * >> | name | mode | notes |
 * >> | --- | --- | --- |
 * >> | main | prod | |
 * >> | rinkeyby | test | |
 * >> | kovan | test | not supported |
 * >> | ropsten | test | not supported |
 * >> | goerli | test | not supported |
 * >
 * > The denomination for amounts is the Wei
 * 
 * #### ohledger, ohledger-web3, ohledger-social
 * 
 * > Addresses and secret keys use Ethereum format.
 * >
 * > Addresses are 20 bytes: 42 character 'hex' strings prefixed with '0x'.
 * > 
 * > Secret keys for signing addresses are 32 bytes: 66 character 'hex' strings prefixed with '0x'.
 * >
 * > Network tuples consist of a 'currency' as a three letter ISO fiat currency code and a 'mode'.  The supported
 * > 'currency' names are:
 * > 
 * > * 'USD'
 * > 
 * > The denominations are:
 * > 
 * >> | Currency | denomination |
 * >> | --- | --- |
 * >> | USD | cents |
 * > 
 * > Note: at this point only USD are supported.  If there is a need, and *overhide-ledger* instances in currencies
 * > other than USD come online, we'll revisit this.
 * >
 * > An 'ohledger' mode is one of 'prod' or 'test'
 * 
 * #### btc-manual
 * 
 * > Addresses use Bitcoin format.
 * > 
 * > Bitcoin network modes are:
 * > 
 * > * prod -- for mainnet
 * > * test -- for testnet
 * > 
 * > The denomination for amounts is the Satoshi.
 * 
 */
const oh$ = (function() {

  var root = typeof self == 'object' && self.self === self && self ||
    typeof global == 'object' && global.global === global && global ||
    this ||
    {};

  root.oh$ = new class extends EventTarget {
    /**
     * @event onWalletChange
     * @param {Object} event object - the event object passed in will have additional attributes
     *
     *  > The new event object will conform to the following:
     *  >
     *  > | imparter tag | event object attributes |
     *  > | --- | --- |
     *  > | * | `{imparterTag:..,isPresent:..}` |
     *  >
     *  > *imparterTag* - causing the event
     *  >
     *  > *isPresent* - if wallet is present for imparter
     *
     * @description
     *   Event called when wallets' state changes.
     * 
     *   In user code:
     * 
     *   ```
     *   oh$.addEventListener('onWalletChange', (e) => console.log(`wallet for ${e.imparterTag} is available:${e.isPresent}`));
     *   ```
     */

    /**
     * @event onWalletPopup
     * @param {Object} event object - the event object passed in will have additional attributes
     *
     *  > The new event object will conform to the following:
     *  >
     *  > | imparter tag | event object attributes |
     *  > | --- | --- |
     *  > | * | `{imparterTag:..}` |
     *  >
     *  > *imparterTag* - causing the pop-up
     *
     * @description
     *   Event called when wallet is expected to popup.  Useful in case user wants to react to popup in UI.
     * 
     *   In user code:
     * 
     *   ```
     *   oh$.addEventListener('onWalletPopup', (e) => console.log(`wallet for ${e.imparterTag} popped`));
     *   ```
     */

    /**
     * @event onCredentialsUpdate
     * @description
     *   Event called when an credentials change for one of the tracked imparters.
     * 
     *   Only called when credentials are valid as per imparter: ready to be used for signing, transacting.
     *
     *   In user code:
     *
     *   ```
     *   oh$.addEventListener('onCredentialsUpdate', (e) => {
     *     console.log(`new address for ${e.imparterTag} is:${e.address}`);
     *     return;
     *   });
     *   ```
     * @param {Object} event object - the event object passed in will have additional attributes
     * 
     *  > The new event object will conform to the following:
     *  >
     *  > | imparter tag | event object attributes |
     *  > | --- | --- |
     *  > | eth-web3 | `{imparterTag:..,address:..}` |
     *  > | ohledger | `{imparterTag:..,address:..,secret:..}` |
     *  > | ohledger-web3 | `{imparterTag:..,address:..}` |
     *  > | ohledger-social | `{imparterTag:..,address:..}` |
     *  > | btc-manual | `{imparterTag:..,address:..}` |
     *  >
     *  > *imparterTag* - causing the event
     *  >
     *  > *address* - ledger public address of credential set for imparter
     *  >
     *  > *secret* - ledger PKI private secret for credential set for imparter
     *
     */

    /**
     * @event onNetworkChange
     * @description
     *   Event called when the network changes for a particular imparter tag.
     * 
     *   For example for "eth" the network could changed from "main" to "rinkeby".  
     * 
     *   In user code:
     *
     *   ```
     *   oh$.addEventListener('onNetworkChange', (e) => {
     *     if (e.imparterTag === 'eth-web3') console.log(`new network selected for ${e.imparterTag} is:${e.name}`);
     *     if (e.imparterTag === /ohledger/.test(e.imparterTag)) console.log(`working in currency: ${e.currency}`);
     *     if (e.imparterTag === 'btc-manual') console.log(`new network mode selected for ${e.imparterTag} is:${e.name}`);
     *     return;
     *   });
     *   ```
     * @param {Object} event object - the event object passed in will have additional attributes
     *
     *  > The new credentials object will conform to the following:
     *  >
     *  > | imparter tag | event object attributes |
     *  > | --- | --- |
     *  > | eth-web3 | `{imparterTag:..,name:('main'|'rinkeby'|'kovan')..,mode:('prod'|'test'), uri:..}` |
     *  > | ohledger | `{imparterTag:..,currency:'USD',mode:('prod'|'test'), uri:..}` |
     *  > | ohledger-web3 | `{imparterTag:..,currency:'USD',mode:('prod'|'test'), uri:..}` |
     *  > | btc-manual | `{imparterTag:..,mode:('prod'|'test'), uri:..}` |
     *  >
     *  > *imparterTag* - causing the event
     *  >
     *  > *name* - of network
     *  >
     *  > *currency* - represented by network
     *  >
     *  > *mode* - production or test network
     *  >
     *  > *uri* - remuneration API URI for network
     *
     */

    /**
     * @namespace oh$
     * @function enable
     * @description
     *   Enable `oh$` by instrumenting with token for ledger access.
     * 
     *   `oh$` calls may stall while waiting for this call to complete successfully.
     * 
     *   A token can be retrieved with a `GET /token` call (see https://token.overhide.io/swagger.html).
     * 
     *   To retrieve tokens please first register for your own API key at https://token.overhide.io/register.
     * @param {string} token
     */
    enable = enable;

    /**
     * @namespace oh$
     * @function getImparterTags
     * @description
     *   Retrieves all imparter tags injected by wallets and statically available from the library.
     * @returns {Array} of strings: the imparter tags available
     */
    getImparterTags = getImparterTags;

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
     *   - btc-manual
     * 
     * @param {string} imparterTag
     * @returns {boolean} 'true' if particular imparter tag can have credentials set.
     */
    canSetCredentials = canSetCredentials;

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
    canGenerateCredentials = canGenerateCredentials;

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
     *   - btc-manual
     *
     * @param {string} imparterTag
     * @returns {boolean} 'true' if particular imparter tag can have networks changed via oh$.
     */
    canChangeNetwork = canChangeNetwork;

    /**
     * @namespace oh$
     * @function generateCredentials
     * @description
     *   For imparters that can have credentials generated, generates them.  
     * 
     *   Fires [onCredentialsUpdate](#eventoncredentialsupdate) event against `oh$`
     * @param {string} imparterTag
     * @param {Object} options - imparter specific generation options, if any.
     * 
     *  > The options objects are as follows:
     *  >
     *  > | imparter tag | credentials object | comments |
     *  > | --- | --- | --- |
     *  > | eth-web3 | N/A | not supported |
     *  > | ohledger | null | |
     *  > | ohledger-web3 | N/A | not supported |
     *  > | btc-manual | N/A | not supported |
     *
     * @returns {Promise} representing a 'true' if success else 'false'; also fires [onCredentialsUpdate](#eventoncredentialsupdate) event against `oh$`

     */
    generateCredentials = generateCredentials;

    /**
     * @namespace oh$
     * @function setCredentials
     * @description
     *   For imparters that can have credentials set, sets them.  
     * 
     *   Fires [onCredentialsUpdate](#eventoncredentialsupdate) event against `oh$`.
     * @param {string} imparterTag
     * @param {Object} credentials - credentials object of imparter specific parameters to set
     * 
     *  > The credentials objects are as follows:
     *  >
     *  > | imparter tag | credentials object | comments |
     *  > | --- | --- | --- |
     *  > | eth-web3 | N/A | not suppoted |
     *  > | ohledger | `{address:..,secret:..}` | `address` is optional, if not set will be extracted from `secret` |
     *  > | ohledger-web3 | N/A | not supported |
     *  > | ohledger-social | `{provider:..}` | `provider` is one of 'google' or 'microsoft'; if null, log-out |
     *  > | btc-manual | `{address:..}` | |
     *
     * @returns {Promise} representing a 'true' if success else 'false'; also fires [onCredentialsUpdate](#eventoncredentialsupdate) event against `oh$`
     */
    setCredentials = setCredentials;

    /**
     * @namespace oh$
     * @function setNetwork
     * @description
     *   For imparters that can have networks changed via oh$, changes it.  
     * 
     *   Fires [onNetworkChange](#eventonnetworkchange) event against `oh$`.
     * @param {string} imparterTag
     * @param {Object} details - network details object of imparter specific parameters to set.
     * 
     *  > The network details objects are as follows:
     *  >
     *  > | imparter tag | network details object | comments |
     *  > | --- | --- | --- |
     *  > | eth-web3 | N/A | not supported, change in wallet |
     *  > | ohledger | `{currency:'USD', mode:'prod'|'test'}` | |
     *  > | ohledger-web3 | `{currency:'USD', mode:'prod'|'test'}` | |
     *  > | btc-manual | `{mode:'prod'|'test'}` | |
     *
     * @returns {Promise} representing a 'true' if success else 'false'; also fires [onNetworkChange](#eventonnetworkchange) event against `oh$`
     */
    setNetwork = setNetwork;

    /**
     * @namespace oh$
     * @function getOverhideRemunerationAPIUri
     * @description
     *   Based on current network set returns the *overhide* remuneration API URI configured in the library.
     * @param {string} imparterTag
     * @returns {string} the URI.
     */
    getOverhideRemunerationAPIUri = getOverhideRemunerationAPIUri;

    /**
     * @namespace oh$
     * @function getCredentials
     * @description
     *   Retrieves current credentials for an imparterTag.
     * @param {string} imparterTag
     * @returns {Object} details - an object describing current credentials, imparterTag dependant:
     * 
     *  > | imparter tag | credentials object |
     *  > | --- | --- |
     *  > | eth-web3 | `{address:..}` |
     *  > | ohledger | `{address:..,secret:..}` |
     *  > | ohledger-web3 | `{address:..}` |
     *  > | ohledger-social | `{address:..}` |
     *  > | btc-manual | `{address:..}` |
     */
    getCredentials = getCredentials;

    /**
     * @namespace oh$
     * @function getNetwork
     * @description
     *   Retrieves current network for an imparterTag.
     * @param {string} imparterTag
     * @returns {Object} details - an object describing current network, imparterTag dependant:
     * 
     *  > | imparter tag | network details object |
     *  > | --- | --- |
     *  > | eth-web3 | `{name:('main'|'rinkeby'|'kovan').., mode:('prod'|'test'), uri:..}` |
     *  > | ohledger | `{currency:'USD',mode:('prod'|'test'), uri:..}` |
     *  > | ohledger-web3 | `{currency:'USD',mode:('prod'|'test'), uri:..}` |
     *  > | btc-manual | `{mode:('prod'|'test'), uri:..}` |
     */
    getNetwork = getNetwork;

    /**
     * @namespace oh$
     * @function getFromDollars
     * @description
     *   Retrieve a (highest) converted amount in imparter specific denomination from a provided dollar amount at a very recent exchange rate.
     * @param {string} imparterTag
     * @param {number} dollarAmount - the dollar amount.
     * @returns {Promise} with the value in imparter specific currency at the present time (based on recent exchange rate).
     */
     getFromDollars = getFromDollars;

    /**
     * @namespace oh$
     * @function getTallyDollars
     * @description
     *   Retrieve a tally of all transactions on the imparter's ledger--perhaps within a date range--converted to a US dollar amount.
     * @param {string} imparterTag
     * @param {Object} recepient - imparter specific object describing recipient of transactions to tally for.
     *
     *  > Recipient objects are as per:
     *  >
     *  > | imparter tag | recipient object |
     *  > | --- | --- |
     *  > | eth-web3 | `{address:..}` |
     *  > | ohledger | `{address:..}` |
     *  > | ohledger-web3 | `{address:..}` |
     *  > | btc-manual | `{address:..}` |
     *
     * @param {Date} since - date to start tally since: date of oldest transaction to include.  No restriction if 'null'.
     * @returns {Promise} with the `{'tally':.., 'as-of':..}` object, whereby the 'tally' value is in US dollars: all transactions 
     *   are exchanged to USD at an approximate (highest) exchange rate close to the transactions' time.  The 'as-of' timestamp 
     *   is that of the call (pass this to back-end to retrieve cached values at better API call rates).
     */
     getTallyDollars = getTallyDollars;

    /**
     * @namespace oh$
     * @function getTally
     * @description
     *   Retrieve a tally of all transactions on the imparter's ledger--perhaps within a date range.
     * @param {string} imparterTag
     * @param {Object} recepient - imparter specific object describing recipient of transactions to tally for.
     *
     *  > Recipient objects are as per:
     *  >
     *  > | imparter tag | recipient object |
     *  > | --- | --- |
     *  > | eth-web3 | `{address:..}` |
     *  > | ohledger | `{address:..}` |
     *  > | ohledger-web3 | `{address:..}` |
     *  > | btc-manual | `{address:..}` |
     *
     * @param {Date} since - date to start tally since: date of oldest transaction to include.  No restriction if 'null'.
     * @returns {Promise} with the `{'tally':.., 'as-of':..}` object, whereby the tally value is in imparter specific currency.
     *   The 'as-of' timestamp is that of the call (pass this to back-end to retrieve cached values at better API call rates).
     */
    getTally = getTally;

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
     *  > Recipient objects are as per:
     *  >
     *  > | imparter tag | recipient object |
     *  > | --- | --- |
     *  > | eth-web3 | `{address:..}` |
     *  > | ohledger | `{address:..}` |
     *  > | ohledger-web3 | `{address:..}` |
     *  > | btc-manual | `{address:..}` |
     *
     * @returns {Promise} with the `{'transactions': [{"transaction-value":..,"transaction-date":..},..], 'as-of':..}` object, 
     *   whereby 'transactions' is the list of transactions and 'as-of' is the timestamp of the call.
     */
    getTransactions = getTransactions;

    /**
     * @namespace oh$
     * @function isOnLedger
     * @description
     *   Determine if current credentials have some transaction on the imparter's ledger: transaction can be to anyone.
     * 
     *   Intent is to validate beyond just a valid address.  To validate the address has been used.
     * 
     *   May fire [onWalletPopup](#eventonwalletpopup) event against `oh$`.
     * @param {string} imparterTag
     * @param {Object} options - options for the specific imparter.
     * 
     *  > The options objects are as follows:
     *  > 
     *  > | imparter tag | credentials object | 
     *  > | --- | --- |
     *  > | eth-web3 | {message:.., signature:..} |
     *  > | ohledger | {message:.., signature:..} |
     *  > | ohledger-web3 | {message:.., signature:..} |
     *  > | ohledger-social | {message:.., signature:..} |
     *  > | btc-manual | {message:.., signature:..} |
     *  > 
     *  > If *message* and *signature* are provided they are used instead of oh$ asking for wallet to resign message.
     * 
     * @returns {Promise} with 'true' or 'false'; may fire [onWalletPopup](#eventonwalletpopup) event against `oh$`
     */
    isOnLedger = isOnLedger;

    /**
     * @namespace oh$
     * @function sign
     * @description
     *   Sign using the provided message using the credentials set against the specific imparter.
     * 
     *   Note: wallet might pop up a dialog upon this call, consider that in your UX flow.
     * 
     *   May fire [onWalletPopup](#eventonwalletpopup) event against `oh$`.
     * @param {string} imparterTag
     * @param {string} message - to sign
     * @returns {Promise} with the signature; may fire [onWalletPopup](#eventonwalletpopup) event against `oh$`
     */
    sign = sign;

    /**
     * @namespace oh$
     * @function createTransaction
     * @description
     *   Create a transaction on the imparter's ledger.
     * 
     *   May fire [onWalletPopup](#eventonwalletpopup) event against `oh$`; wallet might pop up a dialog upon this call, consider that in your UX flow.
     * @param {string} imparterTag
     * @param {number} amount
     * @param {string} to - address of recipient
     * 
     *  > $0 (*amount*) transactions against *ohledger* or *ohledger-web* *imparters* use the current credential 
     *  > as the *to* address, not the specified *to* address.
     *  
     * @param {Object} options - other options required for the specific imparter.
     * 
     *  > The options objects are as follows:
     *  > 
     *  > | imparter tag | credentials object | 
     *  > | --- | --- |
     *  > | eth-web3 | null |
     *  > | ohledger | {message:.., signature:..} |
     *  > | ohledger-web3 | {message:.., signature:..} |
     *  > | ohledger-social | {message:.., signature:..} |
     *  > | btc-manual | null |
     *  > 
     *  > If *message* and *signature* are provided they are used instead of oh$ asking for wallet to resign message.
     *
     * @returns {Promise} of a 'true' for success or an Error; may fire [onWalletPopup](#eventonwalletpopup) event against `oh$`
     */
    createTransaction = createTransaction;
  }();

  var doEnable = null;
  const isEnabled = new Promise((resolve) => doEnable = resolve);
  var token = null;
  var __fetch = null;
  var imparterTags = [ohledger.tag, ohledger_social.tag, btc_manual.tag];

  /**
   * Function to fire events.
   * 
   * @param {string} which - event name to fire
   * @param {Object} params - to copy to event
   */
  function fire(which, params) {
    let event = document.createEvent("Event");
    event.initEvent(which, true, true);
    for (var param in params) {
      event[param] = params[param];
    }
    oh$.dispatchEvent(event);
  }

  /**
   * @param {string} tag -- to add to `imparterTags` if not in `imparterTags`
   */
  function addTag(tag) {
    let imparterTagIndex = imparterTags.findIndex(v => v === tag);
    if (imparterTagIndex == -1) imparterTags.push(tag);
  }

  /**
   * @param {string} tag -- to remove from `imparterTags` if in `imparterTags`
   */
   function removeTag(tag) {
    let imparterTagIndex = imparterTags.findIndex(v => v === tag);
    if (imparterTagIndex > -1) imparterTags.splice(imparterTagIndex, 1);
  }

  const domFns = new dom_fns();
  const web3Wallet = new web3_wallet(
      (tag) => addTag(tag), 
      (tag) => removeTag(tag),
      (which, params) => fire(which, params));
  const overhideWallet = new overhide_wallet(domFns);

  const imparters = {};
  imparters[eth_web3.tag] = new eth_web3(
    web3Wallet, 
    () => token,
    (...args) => __fetch(...args),
    (which, params) => fire(which, params));
  imparters[btc_manual.tag] = new btc_manual(
    domFns,
    () => token,
    (...args) => __fetch(...args),
    (which, params) => fire(which, params));
  imparters[ohledger_web3.tag] = new ohledger_web3(
    overhideWallet,
    web3Wallet,
    () => token,
    (...args) => __fetch(...args),
    (which, params) => fire(which, params)
  );
  imparters[ohledger.tag] = new ohledger(
    overhideWallet,
    web3Wallet,
    () => token,
    (...args) => __fetch(...args),
    (which, params) => fire(which, params)
  );
  imparters[ohledger_social.tag] = new ohledger_social(
    domFns,
    overhideWallet,
    web3Wallet,
    () => token,
    (...args) => __fetch(...args),
    (which, params) => fire(which, params)
  );

  domFns.init();
  web3Wallet.init();
  overhideWallet.init();

  function enable(_token, {fetcher} = {fetcher: fetch}) {
    token = _token;
    __fetch = fetcher;
    doEnable(true);
  }

  function getImparterTags() {
    return imparterTags;
  }

  function canSetCredentials(imparterTag) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    
    return imparters[imparterTag].canSetCredentials();
  }

  function canGenerateCredentials(imparterTag) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    
    return imparters[imparterTag].canGenerateCredentials();
  }

  function canChangeNetwork(imparterTag) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    
    return imparters[imparterTag].canChangeNetwork();
  }

  async function setCredentials(imparterTag, credentials) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    
    return imparters[imparterTag].setCredentials(credentials);
  }

  function getCredentials(imparterTag) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");

    return imparters[imparterTag].getCredentials();
  }

  async function generateCredentials(imparterTag, options) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");

    return imparters[imparterTag].generateCredentials(options);
  }

  async function setNetwork(imparterTag, details) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");

    return imparters[imparterTag].setNetwork(details);
  }

  function getNetwork(imparterTag) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");

    return imparters[imparterTag].getNetwork();    
  }

  function getOverhideRemunerationAPIUri(imparterTag) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");

    return imparters[imparterTag].getOverhideRemunerationAPIUri();    
  }

  async function getFromDollars(imparterTag, dollarAmount) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    if (await isEnabled && !__fetch) throw new Error('did you forget to `oh$.enable(..)`?');

    return await imparters[imparterTag].getFromDollars(dollarAmount);
  }

  async function getTallyDollars(imparterTag, recipient, date) {
    return (await getTxs(imparterTag, recipient, date, true, true));
  }

  async function getTally(imparterTag, recipient, date) {
    return (await getTxs(imparterTag, recipient, date, true, false));
  }

  async function getTransactions(imparterTag, recipient, date) {
    return (await getTxs(imparterTag, recipient, date, false, false));
  }

  async function getTxs(imparterTag, recipient, date, tallyOnly, tallyDollars) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    if (await isEnabled && !__fetch) throw new Error('did you forget to `oh$.enable(..)`?');

    return await imparters[imparterTag].getTxs(recipient, date, tallyOnly, tallyDollars);
  }

  async function isOnLedger(imparterTag, options) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    if (await isEnabled && !__fetch) throw new Error('did you forget to `oh$.enable(..)`?');
    options = options || {};

    return await imparters[imparterTag].isOnLedger(options);
  }

  async function sign(imparterTag, message) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    if (await isEnabled && !__fetch) throw new Error('did you forget to `oh$.enable(..)`?');

    return await imparters[imparterTag].sign(message);
  }

  async function createTransaction(imparterTag, amount, to, options) {
    if (!imparterTag in imparters) throw new Error("invalid imparterTag");
    if (await isEnabled && !__fetch) throw new Error('did you forget to `oh$.enable(..)`?');
    options = options || {};

    return await imparters[imparterTag].createTransaction(amount, to, options);
  }

  return root.oh$;
})();

export default oh$;