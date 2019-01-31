const NRP = require('node-redis-pubsub');
const readline = require('readline');
const getHostInfo = require('get-machine-info');
const connectRedis = require('redis-simple-connect');
const connectNrp = require('./nrpConnection');

const REDIS_OPTS = {
  host: '',
  port: 7869,
  db: 7,
  password: ''
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let target;

function setTarget(rl) {
  rl.question('Target:', (answer) => {
    target = answer;
  });
}

function readCommand(rl, nrp, hosthash) {
  rl.question('>>', (command) => {
    if (command === 'exit') {
      rl.close();
      process.exit();
    } else if (command.indexOf('target #') !== -1) {
      target = command.split('#')[1];
      rl.write(`Target set to #${target}\r\n\r\n`);
      return readCommand(rl, nrp, target);
    }
    nrp.emit(`command:${hosthash}`, { command });
    readCommand(rl, nrp, hosthash);
  });
}

async function main() {
  rl.write('*-- Command emmiter --*\r\n');

  rl.write('! Connecting to Redis... ');
  const emitClient = await connectRedis(REDIS_OPTS);
  rl.write('Emitter OK. ');
  const receiveClient = await connectRedis(REDIS_OPTS);
  rl.write('Reciever OK.\r\n');
  
  const hostinfo = await getHostInfo();
  rl.write(`! ${hostinfo.formatted} #${hostinfo.hash}\r\n`);

  target = hostinfo.hash;
  rl.write(`Target set to this host #${target}\r\n\r\n`);

  const nrpEmit = connectNrp(emitClient, process.env.NRP_SCOPE);
  const nrpReceive = connectNrp(receiveClient, process.env.NRP_SCOPE);

  nrpEmit.on('error', console.error);
  nrpReceive.on('error', console.error);
  nrpReceive.on('reply:*', (data, channel) => {
    const [ scope, event, target ] = channel.split(':');
    const { stdout, stderr, error } = data;
    console.log(JSON.stringify(data) + '\r\n');
  });

  return readCommand(rl, nrpEmit, target);
}

main();
