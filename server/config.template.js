const databaseName = 'tesse';
const serverPort = 8001; // The port server will running
const dbPort = 27017;
const dbUser = "REPLACE_YOUR_HERE";
const dbPassword = "REPLACE_YOUR_HERE";
const clientHttpsHost = `http://localhost:${serverPort}`; // The host use to share the posts

const config = {
  version_ios: '1.12.0',
  domainRoot: 'https://tesse.io',
  corsOptions: {
    // Find and fill your options here: https://github.com/expressjs/cors#configuration-options
  },
  useExpressHostStatic: true, // Use express to host static file or not
  mongoURL: process.env.MONGO_URL || `mongodb://${dbUser}:${dbPassword}@127.0.0.1:${dbPort}/${databaseName}`,
  port: serverPort,
  databaseName,
  dbPort,
  backupFolder: '~/Desktop/Backup/',
  uploadFolder: '/Volumes/DATA/Projects/Web_Projects/NodeJS/TesseBackend',

  /* Cron range
   *
   * Seconds: 0-59
   * Minutes: 0-59
   * Hours: 0-23
   * Day of Month: 1-31
   * Months: 0-11
   * Day of Week: 0-6
  */
  trackingSchedule: 30*60*1000,
  backupTime: '0 0 23 * * *', // 23h every day
  withdrawalTime: '0 0 0 1 * *', // 23h every day
  dailyTrackingTime: '0 59 23 * * *', // 23h every day
  siteMap: '0 0 0 * * *',
  checkStatusLivestream: '* * * * *', // 59 min
  peerPath: '/peer_server',
  clientHttpsHost,
  hostMail : 'REPLACE_YOUR_HERE',
  portMail : 0,
  userMail :'REPLACE_YOUR_HERE',
  passMail :'REPLACE_YOUR_HERE',
  fromMail :'Tesse Inc <notification@tesse.io>',
  // The time for socketIO live after user disconnect with server
  socketSessionTimeout: 10000, // In ms
  taxLevel: 0,
  feesLevel: 0,

  course_fee: 0.3,
  webinar_fee: 0.3,  // 0.3 for 30 %

  tesseBank: {
    _id: '',
    cuid: ''
  },

  // JWT Secret
  jwtSecret: 'REPLACE_YOUR_HERE',

  // Elasticsearch
  esConfigs: {
    host: 'localhost',
    port: 9200,
    log: 'trace'
  },

  // Kue
  kue: {
    prefix: 'q',
    redis: {
      port: 6379,
      host: 'localhost',
      db: 4,
      options: {
        // see https://github.com/mranney/node_redis#rediscreateclient
      }
    }
  },
  kueUI: {
    username: 'boss',
    password: 'laodai',
    port: 3050
  },

  numExpertsPerPage: 10,

  gdrive: {
    clientPath: './config/gdrive/client_secret.json',
    clientPathFS: './config/gdrive/client_secret.json',
    tokenPath: './config/gdrive/drive_token.json',
    tokenDir: './server/',
    authFilePath: '',
    rootFolder: {
      courseDocument: {
        property: '',
        name: ''
      },
      streamCommentFile: {
        property: '',
        name: ''
      },
    },
  },
  google: {
    tokenDir: './config/',
    idSheet:'1kRA6GDE2oXqXa5fzUJaEVtEEc5h8OEWWG-qdjjffLdY',
    rows:2,
    name:'LEADS DK HOC THU!',
    idSheetLeadDK:'1gXbEF-T0GIOd7maHR80dCELkwPbIscTM0x04kMjwiJU'//'1KdCPrjMbHzXtPraQLlsL_j8SL1NHqAbOe7QBcLq_XNE'
  },
  opbeat: {
    appId: 'REPLACE_YOUR_HERE',
    organizationId: 'REPLACE_YOUR_HERE',
    secretToken: 'REPLACE_YOUR_HERE',
    active: process.env.NODE_ENV === 'production'
  },

  tess: {
    _id: '58cba2adaf26811724e55669',
    cuid: 'cj0dl08pn0015kk7myjy7mz2y'
  },

  supportAccounts: {
    tesseSupport: {
      _id: '58cb926daf26811724e555ef',
      cuid: 'cj0dij2y2000ekk7mxmhbhwy6'
    },
    customerSupport: {
      _id: '58cba2adaf26811724e55669',
      cuid: 'cj0dl08pn0015kk7myjy7mz2y'
    }
  },

  simsimi: {
    baseUrl: 'http://sandbox.api.simsimi.com/request.p?',
    key: 'b3a7d74d-fc32-4306-945f-4657d1d95263',
    lc: 'en',
    ft: '1.0'
  },

  // Price Point by $
  pricePoint: 0.025,
  feeExchangePoint: 0.2, // %
  // Price gift by Point
  gifts: {
    flowers: {
      name: 'flowers',
      img: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/96/flower-icon.png',
      points: 10,
      ruby: 10
    },
    coffee: {
      name: 'coffee',
      img: 'http://icons.iconarchive.com/icons/martin-berube/food/96/coffee-icon.png',
      points: 20,
      ruby: 20
    },
    books: {
      name: 'books',
      img: 'http://icons.iconarchive.com/icons/double-j-design/ravenna-3d/96/Book-icon.png',
      points: 30,
      ruby: 30
    },
    wine: {
      name: 'wine',
      img: 'http://icons.iconarchive.com/icons/unclebob/spanish-travel/96/wine-icon.png',
      points: 40,
      ruby: 40
    },
    perfume: {
      name: 'perfume',
      img: 'http://icons.iconarchive.com/icons/dapino/beauty/96/perfume-icon.png',
      points: 50,
      ruby: 50
    },
    watch: {
      name: 'watch',
      img: 'http://icons.iconarchive.com/icons/r34n1m4ted/chanel/96/WATCH-icon.png',
      points: 60,
      ruby: 60
    },
    bag: {
      name: 'bag',
      img: 'http://icons.iconarchive.com/icons/r34n1m4ted/gucci/96/BAG-icon.png',
      points: 70,
      ruby: 70
    },
    iMac: {
      name: 'iMac',
      img: 'http://icons.iconarchive.com/icons/artbees/bee-mac/96/iMac-24-ON-icon.png',
      points: 80,
      ruby: 80
    },
    cars: {
      name: 'cars',
      img: 'http://icons.iconarchive.com/icons/iconshow/transport/96/Sportscar-car-icon.png',
      points: 250,
      ruby: 250
    },
    houses: {
      name: 'houses',
      img: 'http://icons.iconarchive.com/icons/iconshow/construction/96/House-icon.png',
      points: 600,
      ruby: 600
    }
  },
  ruby: 0.025, // Price ruby by $

  sendgridApiKey: '',
  vtpPay: {
    accountName: '',
    webId: '',
    secretKey: "",
    currency: '',
    apiEndPointSandbox: '',
    apiEndPoint: ''
  },
  onePage: {
    account: '',
    accessKey: '',
    secretKey: "",
    discount: {
      viettel: 82.75,
      mobifone: 83,
      vinaphone: 83,
      vnmobile: 84.5,
      gate: 85,
      vcoin: 85
    },
    vat: 1.1
  },
  rateCurrency :'https://www.vietcombank.com.vn/exchangerates/ExrateXML.aspx',

  stream: {
    ws_uri: 'your-kurento-websocket',
    api_uri: 'your-kurento-api',
    antAPI: 'your-ant-api',
  },

  cloudFlare: {
    zoneId: '',
    authEmail: '',
    authKey: ''
  },
  expertLimit:20,
  numToRandom:12,
  knowledgeLimit:9,
  skillLimit:6,
  departmentLimit:2,

  languageMapper: {},

  moneyExchangeRate: {
    vi: 23000
  },
  currency: {
    vi: 'VND'
  },
  languageVi: 'cj0ah7fsr0038yz7m858ayar4',
  aws: {
    configs: {
      accessKeyId     : 'AKIAIVXPQE2BZQSVJQIA',
      secretAccessKey : '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',
      region          : 'ap-southeast-1'
    },
    sns_app_arn: 'arn:aws:sns:ap-southeast-1:099715235915:app/APNS_VOIP_SANDBOX/Tesse-Development'
  },
  //Change to paymentDebug false when deploy production
  paymentDebug: true,
  webinarCommission:0.45,
  affiliateCommission:0.45,
  memberShipsCommission:0.03,
  memberShipsFirstCommission:0.45,
  memberShips: {
    valueDefault: {
      DATE: 0,
      THREEDATE: 0,
      MONTH: 1000000,
      THREEMONTH: 3000000,
      SIXMONTH: 6000000,
      YEAR: 12000000
    },
    value: {
      DATE: 0,
      THREEDATE: 0,
      MONTH: 599000,
      THREEMONTH: 1709000,
      SIXMONTH: 3239000,
      YEAR: 6119000
    },
    time: {
      DATE: 1,
      THREEDATE: 3,
      MONTH: 30,
      THREEMONTH: 90,
      SIXMONTH: 180,
      YEAR: 365
    },
    currency: 'VND',
    lang: 'vi'
  },
  memberShipsTime: {
    DATE: 24*60*60*1000,
    THREEDATE: 3*24*60*60*1000,
    MONTH: 30*24*60*60*1000,
    THREEMONTH: 92*24*60*60*1000,
    SIXMONTH: 183*24*60*60*1000,
    YEAR: 365*24*60*60*1000
  },
  rabbitMQ: {
    url: process.env.RABBIT_URL || 'amqp://localhost',
    rpcQueueName: 'rpc-queue',
  },
  task: {
    social: {
      FBSHAREHOME: {
        value: 1,
        max:4
      },
      FBSHAREMEM: {
        value: 1,
        max:4
      },
      FBSHARETASK: {
        value: 1,
        max:4
      },
      FBCHECKIN: {
        value: 1,
        max:4
      },
      TESSEPOST: {
        value: 1,
        max:4
      },
      FBSHAREPOST: {
        value: 1,
        max:4
      },
      FBWRITEPOST: {
        value: 2,
        max:4
      },
      BLOGPOST: {
        value: 2,
        max:4
      },
      VIDEO: {
        value: 3,
        max:4
      },
      LIVESTREAM: {
        value: 3,
        max:4
      },
      TEST: {
        value: 1,
        max:4
      },
      REF: {
        value: 1,
        max: 10
      },
    },
    REGISTER: 1,
    REGISTRATION: 1,
    LOGINAPP: 3,
    LIKEFB: 1,
    REVIEWFB: 1
  },
  slack: {
    webhook: process.env.SLACK_WEBHOOK || 'https://hooks.slack.com/services/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',
    channel: process.env.SLACK_CHANNEL || '#sale-notification',
    icon_url_success: process.env.SLACK_ICON_SUCCESS || '',
    icon_url_fail: process.env.SLACK_ICON_FAIL || '',
  },
  eSms:{
    apiKey:'5E6B6E565EC5608D7D4FCEDF593882',
    secretKey: '5730F9E51590605A99939E684B01E5',
    brandName: 'MADINA'
  }
  // let keys = [
  //   'f25140ee-054a-489d-b5c8-e82cb16a8cda',
  //   '73cc00c9-1857-45c1-b96b-bbea0b7a4c6e',
  //   'fc161809-b0ba-4b7d-b1c9-864829ab2370',
  //   'b3d605ec-e8d0-4343-a59b-7f64ac67cef8',
  //   '4caa18a4-1274-4c15-a12c-d00adb493232',
  //   'b3a7d74d-fc32-4306-945f-4657d1d95263'
  // ];
};

export default config;
