const NRP = require('node-redis-pubsub');

module.exports = (redisClient, scope) => {
  const nrpConfig = {
    emitter: redisClient,
    receiver: redisClient,
    scope: scope || 'defaultnrpscope'
  };
  return new NRP(nrpConfig);  
}
