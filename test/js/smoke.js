const puppeteer = require('puppeteer');
const path = require('path');

const TOKEN_URL = `https://token.overhide.io/token`;
const API_KEY = '0x___API_KEY_ONLY_FOR_DEMOS_AND_TESTS___';
var TOKEN = null;

// @return promise
function getToken() {
  return new Promise((resolve,reject) => {
    var endpoint = `${TOKEN_URL}?apikey=${API_KEY}`;
    console.log("getToken :: hitting endpoint " + endpoint);
    try {
      require("https").get(endpoint, (res) => {
        const { statusCode } = res;
        if (statusCode != 200) {          
          reject();
        } else {
          res.on('data', (data) => {
            TOKEN = data;
            console.log("getToken :: OK: " + TOKEN);
            resolve();
          })  
        }
      }).on('error', err => reject(err));
    } catch (err) {
      console.log("getToken :: error: " + err);
      reject(err);
    }
  });  
}

async function go (fn) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(`file:${path.join(__dirname, '../html/index.html')}`);
  await page.evaluate(fn, TOKEN);
}

describe('ledgers.js smoke', function() {
  this.timeout('20s');

  // initialization hook for every test
  before((done) => { 
    console.log("Settings: \n");
    TOKEN_URL && console.log('TOKEN_URL:'+TOKEN_URL);
    API_KEY && console.log('API_KEY:'+API_KEY);
    console.log("\n");

    (async () => {
      await getToken();
      done();
    })();
  });

  it('returns canGenerateCredentials properly', async () => {
    await go(async (token) => {
      oh$.enable(token);
      chai.assert(oh$.canGenerateCredentials('ohledger') == true);
      chai.assert(oh$.canGenerateCredentials('ohledger-web3') == false);
      chai.assert(oh$.canGenerateCredentials('eth-web3') == false);
    });
  });

  it('returns canChangeNetwork properly', async () => {
    await go(async (token) => {
      oh$.enable(token);
      chai.assert(oh$.canChangeNetwork('ohledger') == true);
      chai.assert(oh$.canChangeNetwork('ohledger-web3') == true);
      chai.assert(oh$.canChangeNetwork('eth-web3') == false);
    });
  });

  it('can generateCredentials() on ohledger', async () => {
    await go(async (token) => {
      oh$.enable(token);
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
    await go(async (token) => {
      oh$.enable(token);
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
    await go(async (token) => {
      oh$.enable(token);
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
    await go(async (token) => {
      oh$.enable(token);
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