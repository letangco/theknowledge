import redis from 'redis';
import config from '../config';

const client = redis.createClient(config.redisConfig);
//client.auth('abc', reply => console.log('abc'));

module.exports = {
  set: (key, options) => {
    return new Promise((resolve, reject) => {
      if(options.ex) {
        return client.set(key, options.data, 'EX', options.ex, (err, res) => {
          if(err) return reject(err);
          return resolve(res);  
        });
      } else {
        return client.set(key, options.data, (err, res) => {
          if(err) return reject(err);
          return resolve(res);
        });
      }
    });
  },
  
  get: (key) => {
    return new Promise((resolve, reject) => {
      client.get(key, (err, res) => {
        if(err) return reject(err);
        return resolve(res);
      });
    });
  },
  
  hmset: (key, data) => {
    return new Promise((resolve, reject) => {
      client.hmset(key, data, (err, res) => {
        if(err) return reject(err);
        return resolve(res);
      });
    });    
  },
  
  hgetall: (key) => {
    return new Promise((resolve, reject) => {
      client.hgetall(key, (err, res) => {
        if(err) return reject(err);
        return resolve(res);
      });
    });
  },
  
  hget: (key, field) => {
    return new Promise((resolve, reject) => {
      client.hget(key, field, (err, res) => {
        if(err) return reject(err);
        return resolve(res);
      });
    });    
  },
  
  sadd: (key, member) => {
    return new Promise((resolve, reject) => {
      client.sadd(key, member, (err, res) => {
        if(err) return reject(err);
        return resolve(res);
      });
    });    
  },
  
  smembers: (key) => {
    return new Promise((resolve, reject) => {
      client.smembers(key, (err, res) => {
        if(err) return reject(err);
        return resolve(res);
      });
    });    
  },
  
  srem: (key, member) => {
    return new Promise((resolve, reject) => {
      client.srem(key, member, (err, res) => {
        if(err) return reject(err);
        return resolve(res);
      });
    });  
  },
  
  del: (key) => {
    return new Promise((resolve, reject) => {
      client.del(key, (err) => {
        if(err) return reject(err);
        return resolve();
      });
    });
  }
};
