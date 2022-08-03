import winston from 'winston';

const level = process.env.LOG_LEVEL || 'debug';

const myFormat = winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`);

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
    new winston.transports.File({
      filename: 'logs/errors.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/info.log',
      level: 'info',
    }),
    new winston.transports.File({
      filename: 'logs/debug.log',
      level: 'debug',
    })
  ]
});

// Write log to console when run on mode is not production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    level: level,
    timestamp: function () {
      return (new Date()).toISOString();
    },
    format: winston.format.simple(),
  }));
}

logger.logX = function logX(...params) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...params);
  }
};

export default logger;
