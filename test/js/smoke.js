const puppeteer = require('puppeteer');
const path = require('path');

async function go (fn) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file:${path.join(__dirname, '../html/index.html')}`);
  await page.evaluate(fn);
}

describe('ledgers.js smoke', function() {
  this.timeout('20s');

  it('returns canGenerateCredentials properly', async () => {
    await go(async () => {
      chai.assert(oh$.canGenerateCredentials('ohledger') == true);
      chai.assert(oh$.canGenerateCredentials('ohledger-web3') == false);
      chai.assert(oh$.canGenerateCredentials('eth-web3') == false);
    });
  });

  it('returns canChangeNetwork properly', async () => {
    await go(async () => {
      chai.assert(oh$.canChangeNetwork('ohledger') == true);
      chai.assert(oh$.canChangeNetwork('ohledger-web3') == true);
      chai.assert(oh$.canChangeNetwork('eth-web3') == false);
    });
  });

  it('can generateCredentials() on ohledger', async () => {
    await go(async () => {
      var done = false;
      oh$.addEventListener('onCredentialsUpdate', (event) => {
        try {
          if (done) return;
          chai.assert(event.imparterTag == 'ohledger');
        } finally {
          done = true;
        }
      });
      oh$.generateCredentials('ohledger', null);
    });
  });

  it('can setCredentials() on ohledger', async () => {
    await go(async () => {
      var done = false;
      oh$.addEventListener('onCredentialsUpdate', (event) => {
        try {
          if (done) return;
          chai.assert(event.imparterTag == 'ohledger');
          chai.assert(event.address == '0x968A1386f3ce3623a32908cC7Ec3dd6F72E74c36');
          chai.assert(event.secret == '0x1b16186f7cf0aa09f561c7547d0e8ec88fb81fcf573cb8887a7d2aa9b9c284ff');
          chai.assert(event.address == oh$.getCredentials('ohledger').address);
          chai.assert(event.secret == oh$.getCredentials('ohledger').secret);
        } finally {
          done = true;
        }
      });
      oh$.setCredentials('ohledger', { address: '0x968A1386f3ce3623a32908cC7Ec3dd6F72E74c36', secret: '0x1b16186f7cf0aa09f561c7547d0e8ec88fb81fcf573cb8887a7d2aa9b9c284ff'});
    });
  });

  it('can setCredentials() on ohledger from secret only', async () => {
    await go(async () => {
      var done = false;
      oh$.addEventListener('onCredentialsUpdate', (event) => {
        try {
          if (done) return;
          chai.assert(event.imparterTag == 'ohledger');
          chai.assert(event.address == '0x968A1386f3ce3623a32908cC7Ec3dd6F72E74c36'.toLowerCase());
          chai.assert(event.secret == '0x1b16186f7cf0aa09f561c7547d0e8ec88fb81fcf573cb8887a7d2aa9b9c284ff');
          chai.assert(event.address == oh$.getCredentials('ohledger').address);
          chai.assert(event.secret == oh$.getCredentials('ohledger').secret);
        } finally {
          done = true;
        }
      });
      oh$.setCredentials('ohledger', { secret: '0x1b16186f7cf0aa09f561c7547d0e8ec88fb81fcf573cb8887a7d2aa9b9c284ff' });
    });
  });

  it('can setNetwork() on ohledger and getOverhideRemunerationAPIUri', async () => {
    await go(async () => {
      var done = false;
      oh$.addEventListener('onNetworkChange', (event) => {
        try {
          if (done) return;
          chai.assert(event.imparterTag == 'ohledger');
          chai.assert(event.currency == 'USD');
          chai.assert(event.mode == 'test');
          chai.assert(event.uri == oh$.getOverhideRemunerationAPIUri('ohledger'));
          chai.assert(event.uri == oh$.getNetwork('ohledger').uri)
          done = true;
        } finally {
          done = true;
        }
      });
      oh$.setNetwork('ohledger', {currency: 'USD', mode: 'test'});
    });
  });
});