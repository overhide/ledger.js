<p align="center"><a href="https://github.com/overhide"><img src="./.github/logo.png" width="200px"/></a></p>

# ledgers.js

[![npm version](https://badge.fury.io/js/ledgers.js.svg)](https://badge.fury.io/js/ledgers.js)

[This repository](https://github.com/overhide/ledgers.js) is the [distribution](https://www.npmjs.com/package/ledgers.js) of the *ledgers.js* library ([source](https://github.com/overhide/ledgers.js/blob/master/src/ledgers.js))([API](https://overhide.github.io/ledgers.js/ledgers.js-rendered-docs/index.html)) in support of [ledger-based authorization](https://github.com/overhide/ledgers.js/blob/master/why/why.md).

It's a suite of tools to make the [authorization workflows](https://github.com/overhide/ledgers.js/blob/master/why/why.md) part of your application.

![](.github/ledgers.png)
*Figure 1: Where ledgers.js fits in.*

The *ledgers.js* library sits between the *login page* and the *ledgers* it abstracts.

The *library* interacts with in-browser *wallets* for signing (authentication)--if available.

The *library* makes sums  of *ledger* transaction available to the *login page* for authorization criteria checks.  Topping up payments requires transacting with ledgers which is done via linked Web sites and available in-browser *wallets*.

The *business logic* does not leverage *ledgers.js*--the *library* is intended for *login pages* not service code.  The *business logic* code interacts directly with *remuneration APIs*--discussed below.

## More Information

For more information, videos, write-ups, please visit https://overhide.io.

## Getting a Taste

There are two demo applications using *ledgers.js* and a *live API playground*.

## Getting Started

The *ledgers.js* library ['dist' folder](https://github.com/overhide/ledgers.js/blob/master/dist) contains the distributable artifact.

You'll likely want to use [webpack](https://webpack.js.org/) to pull this library in, along with its dependencies ([web3.js](https://github.com/ethereum/web3.js/)).

Within your front-end projects; using *npm* simply:  `npm install ledgers.js --save-prod`.

The *ledgers.js* library exports the `oh$` object--it also sets a global `oh$` object on `window`.

To bring in the `oh$` object into your code using [webpack](https://webpack.js.org/):

```
import oh$ from "ledgers.js";
oh$.onWalletChange = ...
```

Alternativelly--once bundled with its dependencies--the library can be loaded straight into your HTML and accessed by its `oh$` property from the browser's `window` object:

```
<script src="./dist/ledgers.js"></script>
<script>
  oh$.onWalletChange = ...
</script>
```

Keep in mind *ledgers.js* is meant to run with a DOM present--in a browser (not *Node.js*).

## Ecosystem

*ledger.js* ([source](https://github.com/overhide/ledgers.js/blob/master/src/ledgers.js))([API](https://overhide.github.io/ledgers.js/ledgers.js-rendered-docs/index.html)) is part of a larger envisioned ecosystem called [overhide](https://overhide.io).  It works in tandem with the *overhide* Remuneration API.

The *overhide* remuneration API is meant to [enable "ledger-based authorization" with fiat currencies and cryptos](https://github.com/overhide/ledgers.js/blob/master/why/why.md).

The *ledgers.js* library ([source](https://github.com/overhide/ledgers.js/blob/master/src/ledgers.js))([API](https://overhide.github.io/ledgers.js/ledgers.js-rendered-docs/index.html)) is an integral partner to the *overhide* Remuneration API, providing utilities and abstractions for for the browser-centric authentication and payment portions; to enable ledger-based authorization later in the *service-code* or *backend*.

The figure shows the *overhide* Remuneration API landscape and highlights *ledger.js* ([source](https://github.com/overhide/ledgers.js/blob/master/src/ledgers.js))([API](https://overhide.github.io/ledgers.js/ledgers.js-rendered-docs/index.html)) helping a Web app orchestrate a login from within a browser--the red outgoing arrows--as it interacts with the *service code* and *APIs* in the *cloud*.

![](.github/overview-demo.png)
*Figure 2: Shows where ledgers.js fits within the overhide Remuneration API landscape.*

### Remuneration API

The *overhide* remuneration API is an API of two HTTP methods exposed by various ledgers (blockchain and otherwise):

* `/get-transactions/{from-address}/{to-address}`
* `/is-signature-valid`

These API methods are used by the *ledgers.js* library and explicitly called by the *Service Code*.

#### Test Environment APIs

For testing the library interacts with the *Rinkeby* *Ethereum* testnet and the [overhide-ledger test environment](https://test.ohledger.com).   

The respective API instances used are the following test network nodes:

* ether:  [*overhide* Remuneration API for Ethereum](https://rinkeby.ethereum.overhide.io/swagger.html) 
* dollars:  [*overhide-ledger*--the renmuneration provider for US dollars](https://test.ohledger.com/swagger.html)

Use a [Rinkeby](https://faucet.rinkeby.io/) faucet to get "test" Ether for playing around with the library.

Use [Stripe's "test" credit cards](https://stripe.com/docs/testing#cards) to play around with dollar transactions in the library.

#### Production Environment APIs

To interact with the Ethereum *mainnet*, user your wallet.

To interact with the production *overhide-ledger*, visit https://ohledger.com.

For *production instances* of both APIs see:

* [*mainnet* *Ethereum* APIs](https://ethereum.overhide.io/swagger.html)
* [*Production* *overhide-ledger*](https://ohledger.com/swagger.html)

#### Additional Notes on APIs

The *overhide-ledger* [Swagger documentation](https://test.ohledger.com/swagger.html) discusses some additional *HTML*/*js* getter endpoints particular to *overhide-ledger* and not part of the generic remuneration API.  The *ledger.js* ([source](https://github.com/overhide/ledgers.js/blob/master/src/ledgers.js))([API](https://overhide.github.io/ledgers.js/ledgers.js-rendered-docs/index.html))  leverages these additional endpoints when it calls on *overhide-ledger* functionality.  This is similar to how *ledger.js* ([source](https://github.com/overhide/ledgers.js/blob/master/src/ledgers.js))([API](https://overhide.github.io/ledgers.js/ledgers.js-rendered-docs/index.html)) leverages the [web3.js](https://github.com/ethereum/web3.js/) library when working with ether.
