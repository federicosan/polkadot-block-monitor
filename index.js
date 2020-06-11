//leaderboard https://www.hindawi.com/journals/ijcgt/2018/3234873/
'use strict'

const Canvas = require('drawille');
const blessed = require('neo-blessed');
const contrib = require('./contribdemo');
const os = require('os');
const glob = require('glob');
const path = require('path');
const cli = require('commander');
let program = blessed.program();
const VERSION = require('./package.json').version;
let themes = '';
const  DOT_DECIMAL_PLACES = 1000000000000;
const { ApiPromise, WsProvider} = require('@polkadot/api');
const web3Provider = 'wss://cc3-5.kusama.network/';

const drawHeader = (screen, info) => {

  let headerText;
  let headerTextNoTags;

  headerText = ` {bold}Polkadot Block Monitor{/bold}{white-fg} on ${info.chain}`;
  headerTextNoTags = `Polkadot Block Monitor on ${info.chain} `;

  const header = blessed.text({
    top: 'top',
    left: 'left',
    width: headerTextNoTags.length,
    height: '1',
    fg: "#ebdbb2",
    content: headerText,
    tags: true
  });
  const date = blessed.text({
    top: 'top',
    right: 0,
    width: 9,
    height: '1',
    align: 'right',
    content:'' ,
    tags: true
  });
  const nodeName = blessed.text({
    top: 'top',
    height: '1',
    align: 'center',
    content: `| node ${info.nodeName}`,
    tags: true,
    left: Math.floor(program.cols / 2 - (50 / 2))
  });

  const nodeVersion = blessed.text({
    top: 'top',
    height: '1',
    align: 'center',
    content: `| node version ${info.nodeVersion}`,
    tags: true,
    left: Math.floor(program.cols / 2 + 1 )
  });

  screen.append(header);
  screen.append(date);
  screen.append(nodeName);
  screen.append(nodeVersion);

  const zeroPad = input => (`0${input}`).slice(-2);

  const updateTime = () => {
    const time = new Date();
    date.setContent(`${zeroPad(time.getHours())}:${zeroPad(time.getMinutes())}:${zeroPad(time.getSeconds())} `);
    screen.render();
  } 

  
  updateTime();
  
  setInterval(updateTime, 1000);
  
}


const chainInfo = async (api) => {

try {
    //get api consts  
    const theconsts = api.consts;
    
    // Retrieve the chain & node information information via rpc calls
      const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
      ]);

    const existentialDesposit = theconsts.balances.existentialDeposit.toNumber() / DOT_DECIMAL_PLACES;
  
    return {
      chain,
      nodeName,
      nodeVersion,
      existentialDesposit
    };

} catch(e) {
    console.log('Some error with rpc system', e);
}

}

const getProvider = (url = 'wss://kusama-rpc.polkadot.io/') =>  new WsProvider(url); 

const getApi = async (provider) => {
  console.log('getting api');
  try {
    const api =  await ApiPromise.create({provider}); 
    return api;
  
  } catch(e) {
    
    console.log('connection to provider failed', e);
  }

}


async function main(){


const charts = [];

let screen;

  /**
   * This is the number of data points drawn
   * @type {Number}
   */
  let position = 0;

  const size = {
    pixel: {
      width: 0,
      height: 0
    },
    character: {
      width: 0,
      height: 0
    }
  };

 

// Set up the commander instance and add the required options
cli
  .option('--no-mouse', 'Disables mouse interactivity')
  .option('--quit-after [seconds]', 'Quits Polkadot Commander after interval', '0')
  .option('--update-interval [milliseconds]', 'Interval between updates', '300')
  .version(VERSION)
  .parse(process.argv);


  // Create a screen object.
  screen = blessed.screen({
    smartCSR: true,
    autoPadding: true
  });
screen.title = 'Polkadot Commander';

  
const api = await  getApi(getProvider(web3Provider));

const info = await chainInfo(api);





drawHeader(screen, info);


let blocks = blessed.box({
  top: 1,
  label: 'Block #',
  left: 'left',
  width: '10%',
  height: '36%',
  content: '',
  fg: '#ebdbb2',
  tags: true,
  shadow:true,
  border:{
    'type': 'line',
    'fg': '#ebdbb2'
  },
  autoPadding: true,
  style: {
    bg: 'red'
    },
  keys: true,
  vi: true,
  alwaysScroll:true,
  scrollable: true,
  scrollbar: {
    style: {
      bg: 'yellow'
    }
  },
  align:'center',
});


let blockauthors = blessed.box({
  top: 1,
  label: 'Block Author',
  left: '10%',
  width: '52%',
  height: '36%',
  content: '',
  fg: '#ebdbb2',
  tags: true,
  shadow:true,
  border:{
    'type': 'line',
    'fg': '#ebdbb2'
  },
  autoPadding: true,
  style: {
    bg: 'red'
    },
  keys: true,
  vi: true,
  alwaysScroll:true,
  scrollable: true,
  scrollbar: {
    style: {
      bg: 'yellow'
    }
  },
  align:'center',
});



let hashes = blessed.box({
  top:'40%',
  label: 'Block Hash',
  left: 'left',
  width: '62%',
  height: '34%',
  content: '',
  fg: '#ebdbb2',
  tags: true,
  shadow:true,
  border:{
    'type': 'line',
    'fg': '#ebdbb2'
  },
  autoPadding: true,
  style: {
    bg: 'red'
    },
  keys: true,
  vi: true,
  alwaysScroll:true,
  scrollable: true,
  scrollbar: {
    style: {
      bg: 'yellow'
    }
  },
  align:'center',
  });


  let parentHashes = blessed.box({
    bottom: 0,
    label: 'Parent Hash',
    width: '62%',
    height: '34%',
    content: '',
    fg: '#ebdbb2',
    tags: true,
    shadow:true,
    border:{
      'type': 'line',
      'fg': '#ebdbb2'
    },
    autoPadding: true,
    style: {
      bg: 'magenta'
      },
    keys: true,
    vi: true,
    alwaysScroll:true,
    scrollable: true,
    scrollbar: {
      style: {
        bg: 'yellow'
      }
    },
    align:'center',
    });


    let leaderboard = blessed.box({
      top: 1,
      label: 'Leaderboard',
      width: '40%',
      left:'62%',
      height: '100%',
      content: '',
      fg: '#ebdbb2',
      tags: true,
      shadow:true,
      border:{
        'type': 'line',
        'fg': '#ebdbb2'
      },
      autoPadding: true,
      style: {
        bg: 'blue'
        },
      keys: true,
      vi: true,
      alwaysScroll:true,
      scrollable: true,
      scrollbar: {
        style: {
          bg: 'yellow'
        }
      },
      align:'center',
      });



screen.append(blocks);
screen.append(hashes);
screen.append(parentHashes);
screen.append(leaderboard);
screen.append(blockauthors);
screen.render()

let count = 0;

// Subscribe to the new headers on-chain. The callback is fired when new headers
// are found, the call itself returns a promise with a subscription that can be
// used to unsubscribe from the newHead subscription
let blockHash = {};
let signedBlock = {};
let newBlock = 0;
let newBlockHash = '';
let newBlockParentHash = '';
let author = '';

const unsubscribe = await api.derive.chain.subscribeNewHeads(async (header) => {
 try {
    newBlock = `${header.number}`;
    blockHash = await api.rpc.chain.getBlockHash(header.number);
    newBlockHash = `${blockHash}`;
    blocks.insertTop(newBlock);
    hashes.insertTop(newBlockHash);
    author = `${header.author}`;
    signedBlock = await api.rpc.chain.getBlock(blockHash);
    newBlockParentHash = `${signedBlock.block.header.parentHash}`;
    parentHashes.insertTop(newBlockParentHash);
    author = `${header.author}`;
    blockauthors.insertTop(author);
} catch(e){
    console.log(e);
}

});


// Configure 'q', esc, Ctrl+C for quit
let lastKey = '';
screen.on('keypress', (ch, key) => {
  if (key === 'up' || key === 'down' || key === 'k' || key === 'j') {
    // Disable table updates for half a second
    disableTableUpdate = true;
    clearTimeout(disableTableUpdateTimeout)
    disableTableUpdateTimeout = setTimeout(() => {
      disableTableUpdate = false;
    }, 1000);
  }

  if (

    (
      key.name === 'q' ||
      key.name === 'escape' ||
      (key.name === 'c' && key.ctrl === true)
    )
  ) {
    return process.exit(0);
  }

  lastKey = key.name;
 
});


}

main().catch(console.error);




