import serverConfig from '../../server/config';

export const MONGO_CONNECTION_STRING = serverConfig.mongoURL;
export const CORS_OPTIONS = serverConfig.corsOptions;
export const SERVER_PORT = 8009;
