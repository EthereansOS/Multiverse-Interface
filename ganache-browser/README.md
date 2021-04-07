# Ganache Browser

## Run Ganache instance directly in Browser

### Brought to you with <3 by the EthOS Team

While waiting for the future versions of Ganache, which is actually being re-written to be natively, fully Browser compatible, you can use this package which just uses `browserify` and `uglify-js` to pack the original `ganache-core` for the Browser, using `memdown` to save blocks in memory.

## Instructions:

After cloning this repo, execute:

`npm install`

and then

`npm run build`

to build the `dist/ganache.min.js` file.

Now you can import this file in your web application enveloping it in a `script` tag:

Or directly use the build within this repo:

`<script type="text/javascript" src="https://raw.githubusercontent.com/b-u-i-d-l/ganache-browser/main/dist/ganache.min.js"></script>`

To instantiate a provider, you must write:

```
var ganacheProvider = window.Ganache.provider({
    db: window.MemDOWN(), //mandatory
    asyncRequestProcessing : true //optional but extremely useful for performances
    /*
     ** All the other standard Ganache options, including fork!!
     */
});
```

And then unse with your favorite Ethereum node connector, like `web3`

```
//Using some trick for performances, as described in the official Ganache documentation
var web3 = new Web3(ganacheProvider, null, { transactionConfirmationBlocks: 1 });
```

Enjoy it!