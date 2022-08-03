export const RPC_COMMANDS = {
  CREATE_STREAM_QUEUE_JOB: 'CREATE_STREAM_QUEUE_JOB',
  UPDATE_STREAM_STATUS: 'UPDATE_STREAM_STATUS',
  ADD_TRACKING: 'ADD_TRACKING',
  ADD_USER_VIEW_STREAM_TRACKING: 'ADD_USER_VIEW_STREAM_TRACKING',
  ADD_STREAM_INVITE_TRACKING: 'ADD_STREAM_INVITE_TRACKING',
  GET_USER_STREAM_PERMISSION: 'GET_USER_STREAM_PERMISSION',
  GET_USER_SESSION_READY: 'GET_USER_SESSION_READY',
};

export const MORGAN_FORMAT = ':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

export const LIMIT_PAGE = 30;

export const DEFAULT_LANGUAGE = 'vi';
export const RESEND_EMAIL_AFTER_FAILED = 60000;
export const WORKER_NAME = {
  SEND_MAIL: 'SEND_MAIL',
  ROOM_HOOK: 'ROOM_HOOK',
  ROOM_RECORDED_HOOK: 'ROOM_RECORDED_HOOK',
};

export const languageSupportData = [
  {
    'name' : 'Vietnamese',
    'code' : 'vi',
    'level' : [
      'Elementary proficiency',
      'Limited working proficiency',
      'Professional working proficiency',
      'Full professional proficiency',
      'Native or bilingual proficiency',
    ],
  },
  {
    'name' : 'English',
    'code' : 'en',
    'level' : [
      'Elementary proficiency',
      'Limited working proficiency',
      'Professional working proficiency',
      'Full professional proficiency',
      'Native or bilingual proficiency',
    ],
  },
];

export const USER_MIN_PASSWORD_LENGTH = 6;

export const STATUS_AGENT = {
  PENDING: 0,
  UNACTICE: -1,
  ACTVE: 1
};
