/**
 * Use to define constants to use at global scope
 */

const globalConstants = {
  socketActionTypes: {
    REQUEST_CALL_CANCEL: 'REQUEST_CALL_CANCEL', // Caller Cancel the call
    REQUEST_CALL: 'REQUEST_CALL', // Caller request a call
    USER_IS_BUSY: 'USER_IS_BUSY',
    USER_IS_READY: 'USER_IS_READY',
    USER_CANCEL_CALL: 'USER_CANCEL_CALL',
    USER_ACCEPT_CALL: 'USER_ACCEPT_CALL',
    USER_WINDOW_END_CALL: 'USER_WINDOW_END_CALL',
    USER_END_CALL: 'USER_END_CALL',
    FILE_UPLOADED: 'FILE_UPLOADED',
    HAVE_USER_ACCEPT_REQUEST: 'HAVE_USER_ACCEPT_REQUEST',
    USER_REQUEST_BEGIN_TIMER: 'USER_REQUEST_BEGIN_TIMER',
    SERVER_BEGIN_TIMER: 'SERVER_BEGIN_TIMER',

    // When have error
    SERVER_TRANSACTION_FAILED: 'SERVER_TRANSACTION_FAILED',

    // Chat session actions
    REQUEST_BEGIN_CHAT_SESSION: 'REQUEST_BEGIN_CHAT_SESSION',
    REQUEST_CANCEL_CHAT_SESSION: 'REQUEST_CANCEL_CHAT_SESSION',
    REQUEST_END_CHAT_SESSION: 'REQUEST_END_CHAT_SESSION',
    REQUEST_WINDOW_END_CHAT_SESSION: 'REQUEST_WINDOW_END_CHAT_SESSION',
    RESPONSE_ACCEPT_CHAT_SESSION: 'RESPONSE_ACCEPT_CHAT_SESSION',
    RESPONSE_CANCEL_CHAT_SESSION: 'RESPONSE_CANCEL_CHAT_SESSION',

    // Transaction actions
    RESPONSE_OUT_OF_MONEY: 'RESPONSE_OUT_OF_MONEY',

    // User update expert info
    USER_UPDATE_EXPERT_INFO: 'USER_UPDATE_EXPERT_INFO',
    // When user logout
    USER_LOGOUT: 'USER_LOGOUT',
    // When status of user change
    USER_STATUS_CHANGE: 'USER_STATUS_CHANGE'
  },
  ACTIONS: {
    CLICK_LIVESTREAM: 'CLICK_LIVESTREAM',
    CLICK_VIDEO: 'CLICK_VIDEO'
  },
  socketActions: {
    CLIENT: {
      REQUEST: 'CLIENT_REQUEST',
      RESPONSE: 'CLIENT_RESPONSE'
    },
    SERVER: {
      REQUEST: 'SERVER_REQUEST',
      RESPONSE: 'SERVER_RESPONSE'
    }
  },
  userState: {
    OFFLINE: 0,
    ONLINE:  1,
    BUSY:    2,
    READY:   3
  },
  // Chat file upload configs
  chatMaxFileSize: 10485760, // In bytes <=> 10MB
  chatMaxFiles: 10,
  fileTypeAccept: [],
  // In ms, time waiting for receiver answer the call
  sessionWaitingTime: 60000,
  // User's roles
  role: {
    USER: 'user',
    ADMIN: 'admin',
    SUPPERADMIN: 'supperadmin',
    MANAGER: 'manager',
    SALE: 'sale',
    SUPERUSER: 'telesale',
    OPERATION: 'operation',
    MARKETING: 'marketing',
    AGENT: 'agent',
    UNIVERSITY: 'university'
  },
  permissionRole: {
    admin: [],
    supperadmin: [],
    manager: {
      dashboard: 'all',
      users: 'all',
      skills: 'all',
      mails: 'all',
      categories: 'all',
      courses: 'all',
      coupon: 'all',
      affiliate: 'all',
      setting: 'all',
      tasks: 'all',
      multiplechoice: 'all',
      streamtracking: 'all',
      reportebook: 'all'
    },
    sale: {
      dashboard: ['view'],
      users: ['view'],
      membership: ['view'],
      reportebook: ['view'],
      streamtracking: ['view'],
      multiplechoice: ['view'],
    },
    supported: {
      dashboard: ['view'],
      users: ['view'],
      membership: ['view'],
      reportebook: ['view'],
      streamtracking: ['view'],
      multiplechoice: ['view'],
    },
    marketing: {
      dashboard: ['view'],
      mails: ['view', 'add', 'edit', 'delete'],
      categories: ['view', 'add', 'edit', 'delete'],
      setting: ['view', 'add', 'edit', 'delete'],
      knowledge: ['view', 'add', 'edit', 'delete'],
      skills: ['view', 'add', 'edit', 'delete'],
      tasks: ['view', 'add', 'edit', 'delete'],
      reportebook: ['view', 'add', 'edit', 'delete'],
      multiplechoice: ['view', 'add', 'edit', 'delete'],
    },
    operation: {
      dashboard: ['view'],
      users: ['view'],
      mails: ['view', 'add', 'edit', 'delete'],
      tasks: ['view', 'add', 'edit', 'delete'],
      reportebook: ['view', 'add', 'edit', 'delete'],
      multiplechoice: ['view', 'add', 'edit', 'delete'],
      membership: ['view'],
    }
  },
  stopWords: [
    "a", "about", "above", "above", "across", "after", "afterwards", "again",
    "against", "all", "almost", "alone", "along", "already", "also","although",
    "always","am","among", "amongst", "amoungst", "amount",  "an", "and",
    "another", "any","anyhow","anyone","anything","anyway", "anywhere", "are",
    "around", "as",  "at", "back","be","became", "because","become","becomes",
    "becoming", "been", "before", "beforehand", "behind", "being", "below",
    "beside", "besides", "between", "beyond", "bill", "both", "bottom","but",
    "by", "call", "can", "cannot", "cant", "co", "con", "could", "couldnt",
    "cry", "de", "describe", "detail", "do", "done", "down", "due", "during",
    "each", "eg", "eight", "either", "eleven","else", "elsewhere", "empty",
    "enough", "etc", "even", "ever", "every", "everyone", "everything",
    "everywhere", "except", "few", "fifteen", "fify", "fill", "find", "fire",
    "first", "five", "for", "former", "formerly", "forty", "found", "four",
    "from", "front", "full", "further", "get", "give", "go", "had", "has",
    "hasnt", "have", "he", "hence", "her", "here", "hereafter", "hereby",
    "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how",
    "however", "hundred", "ie", "if", "in", "inc", "indeed", "interest", "into",
    "is", "it", "its", "itself", "keep", "last", "latter", "latterly", "least",
    "less", "ltd", "made", "many", "may", "me", "meanwhile", "might", "mill",
    "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my",
    "myself", "name", "namely", "neither", "never", "nevertheless", "next",
    "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now",
    "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or",
    "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over",
    "own","part", "per", "perhaps", "please", "put", "rather", "re", "same",
    "see", "seem", "seemed", "seeming", "seems", "serious", "several", "she",
    "should", "show", "side", "since", "sincere", "six", "sixty", "so", "some",
    "somehow", "someone", "something", "sometime", "sometimes", "somewhere",
    "still", "such", "system", "take", "ten", "than", "that", "the", "their",
    "them", "themselves", "then", "thence", "there", "thereafter", "thereby",
    "therefore", "therein", "thereupon", "these", "they", "thickv", "thin",
    "third", "this", "those", "though", "three", "through", "throughout", "thru",
    "thus", "to", "together", "too", "top", "toward", "towards", "twelve",
    "twenty", "two", "un", "under", "until", "up", "upon", "us", "very", "via",
    "was", "we", "well", "were", "what", "whatever", "when", "whence",
    "whenever", "where", "whereafter", "whereas", "whereby", "wherein",
    "whereupon", "wherever", "whether", "which", "while", "whither", "who",
    "whoever", "whole", "whom", "whose", "why", "will", "with", "within",
    "without", "would", "yet", "you", "your", "yours", "yourself", "yourselves",
    "the"],
  // Knowledge's state
  knowledgeState: {
    DRAFT: 'draft',
    WAITING: 'waiting',
    PUBLISHED: 'published',
    REJECTED: 'rejected'
  },
  // Queue job name
  jobName: {
    AFTER_SAVE_OR_REMOVE_USER_TO_COURSE: 'AFTER_SAVE_OR_REMOVE_USER_TO_COURSE',
    NOTIFICATION_TEACHER:'NOTIFICATION_TEACHER',
    REMIND_RENEW_MEMBERSHIP:'REMIND_RENEW_MEMBERSHIP',
    SCHEDULE_RENEW_MEMBERSHIP:'SCHEDULE_RENEW_MEMBERSHIP',
    DELETE_ELASTICSEARCH_WEBINAR:'DELETE_ELASTICSEARCH_WEBINAR',
    DELETE_ELASTICSEARCH_COURSE:'DELETE_ELASTICSEARCH_COURSE',
    CREATE_ELASTICSEARCH_COURSE:'CREATE_ELASTICSEARCH_COURSE',
    CREATE_ELASTICSEARCH_WEBINAR:'CREATE_ELASTICSEARCH_WEBINAR',
    REMIND_TICKET:'remindTicket',
    REMIND_DAY_TICKET:'remindDayTicket',
    REMIND_INTERACT:'remindInteract',
    REMIND_INTERACT_DAY:'remindInteractDay',
    DELETE_FEED_SCHEDULE: 'deleteFeedSchedule',
    KLGE_SYNC_ELASTIC: 'knowledgeSyncElastic',
    KLGE_REMOVE: 'knowledgeRemove',
    REMIND_DAY_LESSON:'remindDayLesson',
    REMIND_LESSON:'remindLesson',
    ADD_NOTIFICATION_NEW: 'addNewNotification',
    CALC_RATING_AVG: 'calcRatingAvg',
    SYNC_USER_RATING: 'syncUserRating',
    SYNC_USER_SERVICE_RATING: 'syncUserServiceRating',
    SYNC_USER_REVIEWS: 'syncUserReviews',
    CREATE_FEED_COURSE: 'createFeedCourse',
    CREATE_FEED: 'createFeed',
    CREATE_FEED_AFTER_FOLLOW: 'createFeedAfterFollow',
    CREATE_FEED_ONE_USER: 'createFeedOneUser',
    DELETE_FEED: 'deleteFeed',
    DELETE_FEED_COMMENT: 'deleteFeedComment',

    CLEAR_CACHED: 'clearCached',

    ADD_QUESTION: 'addQuestion',

    VIEW_ENGAGEMENT: 'viewEngagement',
    KNOWLEDGE_UPVOTE_ENGAGEMENT: 'knowledgeUpvoteEngagement',
    KNOWLEDGE_COMMENT_ENGAGEMENT: 'knowledgeCommentEngagement',
    KNOWLEDGE_REPLY_ENGAGEMENT: 'knowledgeReplyEngagement',
    SESSION_ENGAGEMENT: 'sessionEngagement',

    SEND_MAIL: 'sendMail',

    QSTN_SYNC_ELASTIC: 'questionSyncElastic',
    QSTN_DELETED: 'questionDeleted',
    QSTN_SYNC_SKILL: 'questionSyncSkill',
    QSTN_PUSH_NOTI: 'questionPushNoti',

    NEW_MESSAGE: 'newMessage',
    ASK_BOT_FOR_ANSWER: 'askBotForAnswer',

    ADD_NOTIFY: 'addNotify',
    PUSH_MSG_NOTIFY_TO_USER: 'pushMsgNotifyToUser',
    PUSH_NOTIFY_TO_USER: 'pushNotifyToUser',

    SKILL_SYNC_ELASTIC: 'skillSyncElastic',

    CHECK_1ST_2MINS_TRANS: 'check1st2MinTrans',

    CREATE_PMT_HISTORY: 'createPaymentHistory',

    USER_SYNC_ELASTIC: 'userSyncElastic',
    USER_REMOVE: 'userRemove',
    BROADCAST_MESSAGE: 'broadcastMessage',
    LIVESTREAM_ACTION: 'liveStreamAction',

    AFTER_JOIN_COURSE: 'afterJoinCourse',
    AFTER_REMOVE_COURSE_CODE: 'afterRemoveCourseCode',
    JOIN_COURSE_AFTER_PAY: 'joinCourseAfterPay',
    JOIN_WEBINAR_AFTER_PAY: 'joinWebinarAfterPay',
    JOIN_MEMBERSHIP_AFTER_PAY: 'joinMemberShipAfterPay',
    DELETE_FILE: 'deleteFile',

    AFTER_APPROVE_REFUND: 'afterApproveRefund',

    CREATE_AFF_HISTORY: 'createAffHistory',
    INCREASE_AFF_OWNER_BALANCE: 'increaseAffOwnerBalance',

    PUSH_VOIP_TO_USER: 'pushVoIPToUser',
    PUSH_VOIP_TO_DEVICE: 'pushVoIPToDevice'
  },

  // User's status
  userStatus: {
    PENDING: 'pending',
    USER: 'user',
    DEACTIVE: 'deactive',
    PENDING_DEL: 'pending_delete',
    DELETED: 'deleted',
    PENDING_EXPERT: 'pending_expert',
    EXPERT: 'expert',
    BANNED: 'banned',
    MEMBERSHIP:'membership',
    USERVN: 'userVN',
    ALL: 'all',
    EXPERT_NO_PROFILE: 'no_profile_expert',
  },
  // Allow payment method types
  methodTypes: {
    paypal: 'paypal',
    SWIFT: 'SWIFT'
  },
  // Daily Tracking Key
  trackingKeys: {
    TOTAL_USERS: 'total_users',
    TOTAL_EXPERTS: 'total_experts',
  },
  ebooks: [
    {
      key: 'ebook-english-01',
      title: 'Chinh phục mọi ngữ pháp Tiếng Anh',
      description: 'Chinh phục mọi ngữ pháp Tiếng Anh.',
      link: 'ebook/EBOOK_NGU_PHAP_TIENG_ANH.pdf'
    },
    {
      key: 'ebook-english-02',
      title: 'Từ vựng Tiếng Anh',
      description: '2000 từ vựng Tiếng Anh cho người mất gốc.',
      link: 'ebook/EBOOK_2000_TU_VUNG_TIENG_ANH.pdf'
    },
    {
      key: 'hoi-thoai-theo-chu-de',
      title: 'Hội thoại theo chủ để',
      link: 'ebook/EBOOK_100-MAU-HOI-THOAI-THEO-CHU-DE-THONG-DUNG-NHAT-TRONG-GIAO-TIEP-TIENG-ANH.pdf',
    },
    {
      key: 'ten-goi-cac-quoc-gia',
      title: 'Gọi tên các quốc gia trên thế giới',
      link: 'ebook/EBOOK_GOI-TEN-CAC-QUOC-GIA-TREN-THE-GIOI.pdf',
    },
    {
      key: 'tu-vung-ve-con-nguoi',
      title: 'TỪ VỰNG CHỦ ĐỀ CON NGƯỜI VÀ MỐI QUAN HỆ TRONG GIA ĐÌNH',
      link: 'ebook/EBOOK_TU-VUNG-CON-NGUOI-VA-MQH-TRONG-GIA-DINH.pdf',
    },
    {
      key: 'bi-quyet-cham-soc-tre-em',
      title: 'Bí quyết chăm sóc trẻ em',
      link: 'ebook/biquyetchamsoctre.pdf',
    },
    {
      key: 'nhung-cau-ngon-ngu',
      title: 'HỌC TIẾNG ANH QUA TRUYỆN NGẮN',
      link: 'ebook/EBOOK_NHUNG-CAU-CHUYEN-NGU-NGON-SONG-NGU-HAY-NHAT.pdf',
    },
    {
      key: 'du-lich',
      title: 'ĐI DU LỊCH PHẢI CÓ TIẾNG ANH',
      link: 'ebook/DI-DU-LICH-PHAI-CO-TIENG-ANH.pdf',
    },
    {
      key: '12-thi-thong-dung',
      title: 'THÁCH THỨC 12 THÌ THÔNG DỤNG TRONG TIẾNG ANH',
      link: 'ebook/EBOOK_THACH-THUC-12-THI-THONG-DUNG-TRONG-TIENG-ANH.pdf',
    }
  ]
};

export default globalConstants;

export const RABBITMQ_RESTART_AFTER = 300000; // Wait for time to republish data to queue again

export const EMAIL_CONTACT_INFO =
  '<br /><p></p><b>TheKnowledge.Ai Team </b></p> <br />' +
  '<p>Website: https://theknowledge.ai</p>' +
  '<p>Email: Hello@theknowledge.ai</p>';

export const EMAIL_CONTACT_INFO_AGENT_PAGE =
  '<br /><p></p><b>VirtualAgent.TheKnowledge.Ai Team </b></p> <br />' +
  '<p>Website: https://virtualagent.theknowledge.ai/</p>' +
  '<p>Email: hello@virtualagent.theknowledge.ai</p>';

export const TEACHER_MEMBERSHIP_TYPE = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
  DAILY: 'daily',
};

export const TEACHER_MEMBERSHIP_PACKAGE_TYPE = {
  TEACHER: 'teacher',
  CENTER: 'center',
  ADMIN_RENEW: 'admin_renew',
};

export const TEACHER_REGISTRATION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  DELETED: 'deleted',
  PAUSED: 'paused',
  FAILED: 'failed',
};
export const ORDER_TYPE = {
  ALL: 'all',
  COURSE: 'course',
  MEMBERSHIP: 'membership'
};
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 200;

export const COURSE_STATUS = {
  living: 1,
  on_going: 2,
  up_coming: 3,
  finish: 4,
  waiting: 5,
  rejected: 6,
  waiting_delete: 7,
  deleted: 8,
  expired: 9,
};

export const ERR_CODE = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_IS_UNACTIVE: "USER_IS_UNACTIVE",
  USER_HAS_REGISTER_TO_AGENT: "USER_HAS_REGISTER_TO_AGENT",
  PHONE_INVALID: "PHONE_INVALID",
  PASSWORD_INVALID_LENGTH: "PASSWORD_INVALID_LENGTH",
  ROLE_IS_NOT_EMPTY: 'ROLE_IS_NOT_EMPTY',
  EMAIL_IS_NOT_EMPTY: 'EMAIL_IS_NOT_EMPTY',
  EMAIL_HAS_BEEN_USED: "EMAIL_HAS_BEEN_USED",
  ROLE_INVALID: "ROLE_INVALID",
  STATUS_INVALID: "STATUS_INVALID",
  UNAUTHORIZE: "UNAUTHORIZE",
  TITLE_IS_NOT_EMPTY: 'TITLE_IS_NOT_EMPTY',
  CONTENT_IS_NOT_EMPTY: 'CONTENT_IS_NOT_EMPTY',
  AGENT_NOT_FOUND: "AGENT_NOT_FOUND",
  SLUG_IS_NOT_EMPTY: 'SLUG_IS_NOT_EMPTY',
  TYPE_SORT_INVALID: 'TYPE_SORT_INVALID',
  ERR_NOT_FOUND: 'ERR_NOT_FOUND',
  NEWS_IS_PRIORITY: 'NEWS_IS_PRIORITY',
  SHORT_DESCRIPTION_IS_NOT_EMPTY: 'SHORT_DESCRIPTION_IS_NOT_EMPTY',
  SUBJECT_IS_NOT_EMPTY: 'SUBJECT_IS_NOT_EMPTY',
  QUESTION_IS_NOT_EMPTY: 'QUESTION_IS_NOT_EMPTY',
  SCORE_IS_NOT_EMPTY: 'SCORE_IS_NOT_EMPTY',
  TYPE_SELECTION_POINT_TEST: 'TYPE_SELECTION_POINT_TEST',
  TAG_IS_NOT_EMPTY: 'TAG_IS_NOT_EMPTY',
  TYPE_TAG_NOT_EMPTY: 'TYPE_TAG_NOT_EMPTY',
  TYPE_TAG_INVALID: 'TYPE_TAG_INVALID',
  TAG_IS_EXIST: 'TAG_IS_EXIST',
  SORT_INDEX_NOT_EMPTY: 'SORT_INDEX_NOT_EMPTY',
  ORGANIZATION_NOT_EMPTY: 'ORGANIZATION_NOT_EMPTY',
  ABN_NUMBER_NOT_EMPTY: 'ABN_NUMBER_NOT_EMPTY',
  ADDRESS_NOT_EMPTY: 'ADDRESS_NOT_EMPTY',
  COUNTRY_NOT_EMPTY: 'COUNTRY_NOT_EMPTY',
  STATE_NOT_EMPTY: 'STATE_NOT_EMPTY',
  COUNTRY_INVALID: 'COUNTRY_INVALID',
  STATE_INVALID: 'STATE_INVALID'
};

export const TYPE_SELECT_POINT_TEST = {
  CHECKBOX: 0,
  SELECTION: 1
};