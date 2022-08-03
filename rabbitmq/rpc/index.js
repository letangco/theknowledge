import amqplib from 'amqplib';
import logger from '../../server/util/log';
import config from '../../server/config';
import AMQPRPCClient from './AMQPRPCClient';
import AMQPRPCServer from './AMQPRPCServer';
import { RPC_COMMANDS } from '../../server/constants';
import StringHelper from '../../server/util/StringHelper';
import * as LiveStreamRPC from '../../server/rpc_services/liveStream.rpc';

export default class RPC {
  static connection = null;
  static client = null;
  /**
   * Init connection and channel
   * @param {String} queueName
   * @returns {Promise<void>}
   */
  static async initialSetup(queueName) {
    try {
      const connection = await amqplib.connect(config.rabbitMQ.url);
      RPC.connection = connection;
      const channel = await connection.createChannel();
      await channel.assertQueue(queueName);
      return connection;
    } catch (error) {
      logger.error('RPC initialSetup error:');
      logger.error(error);
      throw error;
    }
  }

  /**
   * Add server handler
   * @param {String} requestsQueue
   * @return {Promise<void>}
   */
  static async initServer(requestsQueue) {
    try {
      const server = new AMQPRPCServer(RPC.connection, { requestsQueue });
      // Handle request
      server.addCommand(RPC_COMMANDS.UPDATE_STREAM_STATUS, LiveStreamRPC.changeStreamStatus);
      server.addCommand(RPC_COMMANDS.CREATE_STREAM_QUEUE_JOB, LiveStreamRPC.createStreamQueueJob);
      server.addCommand(RPC_COMMANDS.ADD_TRACKING, LiveStreamRPC.addViewTracking);
      server.addCommand(RPC_COMMANDS.ADD_USER_VIEW_STREAM_TRACKING, LiveStreamRPC.addUserViewStreamTracking);
      server.addCommand(RPC_COMMANDS.ADD_STREAM_INVITE_TRACKING, LiveStreamRPC.addStreamInviteTracking);
      server.addCommand(RPC_COMMANDS.GET_USER_STREAM_PERMISSION, LiveStreamRPC.getUserStreamPermission);
      server.addCommand(RPC_COMMANDS.GET_USER_SESSION_READY, LiveStreamRPC.getIsUserSessionReady);

      await server.start();
      logger.info('RPC server is running...');
      return server;
    } catch (error) {
      logger.error('RPC initServer error:');
      logger.error(error);
      throw error;
    }
  }

  /**
   * Init client
   * @param {String} requestsQueue
   * @return {Promise<void>}
   */
  static async initClient(requestsQueue) {
    const client = new AMQPRPCClient(RPC.connection, {requestsQueue});
    await client.start();
    RPC.client = client;
    logger.info('RPC client is running...');
    //
    // const response1 = await client.sendCommand('hello', ['Tom']);
    // logger.info(`Tom got hello response ${response1.message}`);
    //
    // const response2 = await client.sendCommand('get-time', []);
    // logger.info(`Tom got 1st response for get-time: ${response2.time}`);
    //
    // const response3 = await client.sendCommand('get-time', []);
    // logger.info(`Tom got 2nd response for get-time: ${response3.time}`);
  }
}
