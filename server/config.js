const serverPort = 8001; // The port server will running
// const dbHost = '52.221.143.102';
// const databaseName = 'knowledge';
// const dbPort = 2032;
// const dbUser = "knowledge";
// const dbPassword = "oOOJAP72VzzdnPndyHSj";
const dbHost = 'localhost';
const dbPort = '27017';
const databaseName = 'theknownledge';
const DB_USER = '';
const DB_PASS = '';
const clientHttpsHost = `http://localhost:8001`; // The host use to share the posts
const domainHttpHost = 'https://theknowleadegai-api.tesse.io';
const config = {
    domainRoot: 'https://tesse.io',
    host: 'https://tesse.io/',
    antApi: 'https://www.live.tesse.io/ant/broadcast',
    corsOptions: {
        // Find and fill your options here: https://github.com/expressjs/cors#configuration-options
    },
    useExpressHostStatic: true, // Use express to host static file or not
    // mongoURL: `mongodb://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${databaseName}?authSource=knowledge&w=1`,
    mongoURL: process.env.MONGO_URL || `mongodb://${dbHost}:${dbPort}/${databaseName}`,
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
    trackingSchedule: 30 * 60 * 1000,
    backupTime: '0 0 23 * * *', // 23h every day
    withdrawalTime: '0 0 0 1 * *', // 23h every day
    dailyTrackingTime: '0 59 23 * * *', // 23h every day
    siteMap: '0 5 * * * *', // 24h every day
    checkStatusLivestream: '* * * * *', // 59 min
    sendEmailtoTutorNonProfile: '0 0 */2 * *', // 2 days
    trackingTimeCheckUpdateTutorProfile: '0 59 23 * * *',
    peerPath: '/peer_server',
    clientHttpsHost,
    domainHttpHost,
    hostMail: 'REPLACE_YOUR_HERE',
    portMail: 0,
    userMail: 'REPLACE_YOUR_HERE',
    passMail: 'REPLACE_YOUR_HERE',
    fromMail: 'The Knowledge <hello@theknowledge.ai>',
    fromMailAgentPage: 'The VirtualAgent <hello@virtualagent.theknowledge.ai>',
    sendMailTo: 'pngocthan1988@gmail.com',
    // The time for socketIO live after user disconnect with server
    socketSessionTimeout: 10000, // In ms
    taxLevel: 0,
    feesLevel: 0,
    PercentRevenue: 95,
    course_fee: 0,
    webinar_fee: 0, // 0.3 for 30 %

    tesseBank: {
        _id: '5a09749ef4b6872648fbccc8',
        cuid: 'cj9y1unrq0000k8o95311h601'
    },

    // JWT Secret
    jwtSecret: 'UmV4dmlldGJvc3M',

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
        port: 3051
    },
    languageDefault: 'en',
    numExpertsPerPage: 10,
    gdrive: {
        clientPath: '../../config/gdrive/client_secret.json',
        tokenPath: './config/gdrive/drive_token.json',
        tokenDir: './config/gdrive/',
        subOwnerEmail: 'ntnahn@gmail.com',
        authFilePath: '../../config/gdrive/TestDriveUpload-bda3a6dc1c1e.json',
        // authFilePath: '../../../../config/gdrive/vsnacademy-222304-846b77d5951c.json',
        rootFolder: {
            courseDocument: {
                property: 'dev-server-tesse-document',
                name: 'DevServerTESSEDocument'
            },
            streamCommentFile: {
                property: 'dev-server-tesse-document',
                name: 'DevServerTESSEDocument'
            },
        },
    },

    opbeat: {
        appId: 'REPLACE_YOUR_HERE',
        organizationId: 'REPLACE_YOUR_HERE',
        secretToken: 'REPLACE_YOUR_HERE',
        active: process.env.NODE_ENV === 'production'
    },
    google: {
        tokenDir: './config/',
        idSheet: '1kRA6GDE2oXqXa5fzUJaEVtEEc5h8OEWWG-qdjjffLdY',
        rows: 2,
        name: 'LEADS DK HOC THU!',
        idSheetLeadDK: '1gXbEF-T0GIOd7maHR80dCELkwPbIscTM0x04kMjwiJU' //'1KdCPrjMbHzXtPraQLlsL_j8SL1NHqAbOe7QBcLq_XNE'
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

    sendgridApiKey: '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',
    vtpPay: {
        accountName: '0931045700',
        webId: '8640',
        secretKey: "VSNecademy@2018!@##@!",
        currency: 'VND',
        apiEndPointSandbox: 'http://alpha1.vtcpay.vn/portalgateway/checkout.html',
        apiEndPoint: 'https://vtcpay.vn/bank-gateway/checkout.html'
    },
    reviewCourseOptionMapper: {
        'improve_course': '5addab5be22b3ac4b6631807',
        'improve_lectures': '5addabb1e22b3ac4b6631808',
        'love_course': '5addabe2e22b3ac4b6631809',
        'love_lectures': '5addac05e22b3ac4b663180a',
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
    rateCurrency: 'https://www.vietcombank.com.vn/exchangerates/ExrateXML.aspx',
    stream: {
        ws_uri: 'ws://45.252.250.102:8888/kurento', // Server dev
        api_uri: 'http://45.252.250.102:8003/kurento',
        antAPI: 'https://www.live.tesse.io'
    },

    cloudFlare: {
        zoneId: '',
        authEmail: '',
        authKey: ''
    },
    expertLimit: 12,
    numToRandom: 12,
    knowledgeLimit: 9,
    skillLimit: 6,
    departmentLimit: 2,

    languageMapper: {
        'ckk3umhhc0000n5p4ntl3ctrf': {
            cuid: "ckk3umhhc0000n5p4ntl3ctrf",
            name: "Vietnamese"
        },
        'ckk3umhhe0001n5p4sp9r26ms': {
            cuid: "ckk3umhhe0001n5p4sp9r26ms",
            name: "English"
        }
    },

    moneyExchangeRate: {
        vi: 23000,
        en: 1
    },
    currency: {
        vi: 'VND',
        en: 'USD'
    },
    languageVi: 'cj0ah7fsr0038yz7m858ayar4',
    timeZoneServer: -420,
    aws: {
        configs: {
            accessKeyId: 'AKIAIVXPQE2BZQSVJQIA',
            secretAccessKey: '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',
            region: 'ap-southeast-1'
        },
        sns_app_arn: 'arn:aws:sns:ap-southeast-1:099715235915:app/APNS_VOIP_SANDBOX/Tesse-Development'
    },
    apn: {
        APN_KEY_NAME: 'AuthKey_3V2CUJF3Q9.p8',
        APP_KEY_ID: '3V2CUJF3Q9',
        APP_TEAM_ID: 'S22U95725K',
        APP_BUNDLE_IDENTIFIER: 'tesseIo.K-Wiki'
    },
    ant: {
        wsUrl: 'https://www.live.tesse.io/ant',
        mediaUrl: 'https://live.tesse.io:5443/WebRTCAppEE/streams',
        rtmpServerURL: "rtmp://live.tesse.io/WebRTCAppEE",
        fetchHLSTimes: 1, // The max num try to fetch hls stream source
    },
    vnPay: {
        VNP_COMMAND: 'pay',
        VNP_VERSION: 2,
        VNP_TMN_CODE: 'E98CZCSB',
        VNP_HASH_SECRET: 'IQXBQEFNKXCZIFIXEVAXSNJFREGXNIGS',
        VNP_HASH_SECRET_TYPE: 'SHA256',
        VNP_URL: 'http://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        VNP_URL_RETURN: 'http://localhost:8001/api/payment/vnpay_return',
        LOCALE: 'vn',
        CURRENCY_CODE: 'VND'
    },
    //Change to paymentDebug false when deploy production
    paymentDebug: true,
    webinarCommission: 0.45,
    affiliateCommission: 0.45,
    memberShipsCommission: 0.03,
    memberShipsFirstCommission: 0.45,
    memberShips: {
        valueDefault: {
            DATE: 0,
            MONTH: 95000,
            YEAR: 1140000
        },
        value: {
            DATE: 0,
            MONTH: 95000,
            YEAR: 969000
        },
        time: {
            DATE: 1,
            MONTH: 30,
            YEAR: 365
        },
        currency: 'VND',
        lang: 'vi'
    },
    memberShipsTime: {
        DATE: 24 * 60 * 60 * 1000,
        MONTH: 30 * 24 * 60 * 60 * 1000,
        YEAR: 365 * 24 * 60 * 60 * 1000
    },
    task: {
        social: {
            FBSHAREHOME: {
                value: 1,
                max: 4
            },
            FBSHAREMEM: {
                value: 1,
                max: 4
            },
            FBSHARETASK: {
                value: 1,
                max: 4
            },
            FBCHECKIN: {
                value: 1,
                max: 4
            },
            TESSEPOST: {
                value: 1,
                max: 4
            },
            FBSHAREPOST: {
                value: 1,
                max: 4
            },
            FBWRITEPOST: {
                value: 2,
                max: 4
            },
            BLOGPOST: {
                value: 2,
                max: 4
            },
            VIDEO: {
                value: 3,
                max: 4
            },
            LIVESTREAM: {
                value: 3,
                max: 4
            },
            TEST: {
                value: 1,
                max: 4
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
    rabbitMQ: {
        url: process.env.RABBIT_URL || 'amqp://localhost'
    },
    emailSale: 'tesse.sale@gmail.com',
    innotek: [
        "58cb83c6af26811724e555dd",
        "58cb926daf26811724e555ef",
        "58cc331aaf26811724e55b89",
        "58cd75bfaf26811724e55fc4",
        "58ce43beaf26811724e56123",
        "58d0ebf6af26811724e56386",
        "58e3d0d4b4899d6d488c628a",
        "58e7350a0fc0f92c8685b2a0",
        "58e88209ffcbfa2c94557e69",
        "58f08c515de0fb126a478215",
        "58f7829cba437b4ed8ad8a67",
        "58f9bb4bba437b4ed8ad8e2d",
        "5900dd1f8e71ee77c0c7b054",
        "5916d343a9b218250f44d316",
        "592fcf1b44cc4013d4a4c8d2",
        "5959e826bc5834216f1060d2",
        "597550ae91b4ee30cb7e89fa",
        "5d0b0ce45dcbcd60758b949c",
        "5d0b0d1a5dcbcd60758b949f",
        "5d0b0d3b5dcbcd60758b94a1",
        "5d0b0d5d5dcbcd60758b94a3",
        "5d0b0d7c5dcbcd60758b94a5",
        "5d0b0e7f5dcbcd60758b94bf",
        "5d0b0e9f5dcbcd60758b94c7",
        "5d0b10565dcbcd60758b94cb",
        "5d0b10945dcbcd60758b94d0",
        "5d0b10ae5dcbcd60758b94d2",
        "5d0b10fe5dcbcd60758b94e3",
        "5d0b11215dcbcd60758b94e7",
        "5d0b118c5dcbcd60758b94ea",
        "5d0b11a35dcbcd60758b94ec",
        "5d0b11c25dcbcd60758b94ef",
        "5d0b11e35dcbcd60758b94f2",
        "5d0b12055dcbcd60758b94f4",
        "5d0b127c5dcbcd60758b94f6",
        "5d0b12c75dcbcd60758b94f8",
        "5d0b12e45dcbcd60758b94fa",
        "5d0b136f5dcbcd60758b94fd",
        "5d0b138e5dcbcd60758b94ff",
        "5d0b140b5dcbcd60758b9503",
        "5d0b14705dcbcd60758b9509",
        "5d0b15075dcbcd60758b9516",
        "5d0b15235dcbcd60758b9518",
        "5d0b161b5dcbcd60758b951a",
        "5d0b16635dcbcd60758b951c",
        "5d0b168b5dcbcd60758b951e",
        "5d0b16ce5dcbcd60758b9520",
        "5d0b16eb5dcbcd60758b9522",
        "5d0b2efc5dcbcd60758b9654",
    ],
    // let keys = [
    //   'f25140ee-054a-489d-b5c8-e82cb16a8cda',
    //   '73cc00c9-1857-45c1-b96b-bbea0b7a4c6e',
    //   'fc161809-b0ba-4b7d-b1c9-864829ab2370',
    //   'b3d605ec-e8d0-4343-a59b-7f64ac67cef8',
    //   '4caa18a4-1274-4c15-a12c-d00adb493232',
    //   'b3a7d74d-fc32-4306-945f-4657d1d95263'
    // ];
    languageconfidence: {
        api: 'https://api.languageconfidence.ai/pronunciation-trial-V2//score',
        key: 'k3P4lv51Bj6nKWhjAnNFC9fFjR1Yutv64Ajq3YTa'
    },
    stripe: {
        webhook_secret_key: 'whsec_YK6dV7XukiTKhy7qobQSOkPM0uQUejj9',
        secret_key: 'sk_test_51HzacHD8XOPOKKPFLDYoNSrmG6lpZ2CN8g6Kgq4tysuXCf0SXYFtk54mvkV1zwewym2tA64Iqm97DNXgDE7kaeEc00bvVD6bhH',
    }
};

export default config;

export const ATSSO = {
    clientId: 'clientapp',
    clientSecret: '123456',
    domain: 'https://sso-dev.directsale.vn',
};