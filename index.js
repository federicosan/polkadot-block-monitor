//leaderboard https://www.hindawi.com/journals/ijcgt/2018/3234873/
'use strict'

const Canvas = require('drawille');
const blessed = require('neo-blessed');
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

const drawHeader = (screen) => {

  let headerText;
  let headerTextNoTags;

  headerText = ` {bold}Polkadot Block Monitor{/bold}{white-fg} for ${os.hostname()}`;
  headerTextNoTags = `Polkadot for ${os.hostname()} `;

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
    content: '',
    tags: true
  });
  const loadAverage = blessed.text({
    top: 'top',
    height: '1',
    align: 'center',
    content: '',
    tags: true,
    left: Math.floor(program.cols / 2 - (28 / 2))
  });

  screen.append(header);
  screen.append(date);
  screen.append(loadAverage);

  const zeroPad = input => (`0${input}`).slice(-2);

  const updateTime = () => {
    const time = new Date();
    date.setContent(`${zeroPad(time.getHours())}:${zeroPad(time.getMinutes())}:${zeroPad(time.getSeconds())} `);
    screen.render();
  } 

  const updateLoadAverage = () => {
    const avg = os.loadavg();
    loadAverage.setContent(`Load Average: ${avg[0].toFixed(2)} ${avg[1].toFixed(2)} ${avg[2].toFixed(2)}`);
    screen.render();
  }

  updateTime();
  updateLoadAverage();
  setInterval(updateTime, 1000);
  setInterval(updateLoadAverage, 1000);
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

    const existentialDesposit = theconsts.balances.existentialDeposit.toNumber();

    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
    console.log(`The existential deposit for chain is ${existentialDesposit / DOT_DECIMAL_PLACES} KSM.`);

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
let loadedTheme;  
/* let screen; */

/* // Create a screen object.
screen = blessed.screen();
screen.title = 'Polkadot Commander'; */

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

// style themes 
const files = glob.sync(path.join(__dirname, 'themes', '*.json'));
for (var i = 0; i < files.length; i++) {
  let themeName = files[i].replace(path.join(__dirname, 'themes') + path.sep, '').replace('.json', '');
  themes += `${themeName}|`;
}
themes = themes.slice(0, -1);

// Set up the commander instance and add the required options
cli
  .option('-t, --theme  [name]', `set the Polkadot Commander theme [${themes}]`, 'parallax')
  .option('--no-mouse', 'Disables mouse interactivity')
  .option('--quit-after [seconds]', 'Quits Polkadot Commander after interval', '0')
  .option('--update-interval [milliseconds]', 'Interval between updates', '300')
  .version(VERSION)
  .parse(process.argv);


// Configure 'q', esc, Ctrl+C for quit
  let lastKey = '';
/*   screen.on('keypress', (ch, key) => {
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
   
  }); */

//drawHeader(screen);

const api = await getApi(getProvider(web3Provider));

chainInfo(api);


let count = 0;

// Subscribe to the new headers on-chain. The callback is fired when new headers
// are found, the call itself returns a promise with a subscription that can be
// used to unsubscribe from the newHead subscription
let blockHash;
let signedBlock;

const unsubscribe = await api.derive.chain.subscribeNewHeads(async (header) => {
 try {
    console.log(`Chain is at block #${header.number} : autor is ${header.author}`);
    blockHash = await api.rpc.chain.getBlockHash(header.number);
    console.log(`Block hash is ${blockHash}`);
    signedBlock = await api.rpc.chain.getBlock(blockHash);
    console.log(`Block's parent hash is ${signedBlock.block.header.parentHash}`);
 
  if (++count === 256) {
    unsubscribe();
    process.exit(0);
  }
} catch(e){
    console.log(e);
}

});


}

main().catch(console.error);




