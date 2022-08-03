import AMPQ from '../../../rabbitmq/ampq';
import globalConstants from '../../../config/globalConstants';
import logger from '../../util/log';
import { WORKER_NAME } from '../../constants';

export async function createQueue() {
  try {
    await AMPQ.initChannel();
    AMPQ.initQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW);
    AMPQ.initQueue(globalConstants.jobName.PUSH_MSG_NOTIFY_TO_USER, false);
    AMPQ.initQueue(globalConstants.jobName.PUSH_NOTIFY_TO_USER, false);
    AMPQ.initQueue(globalConstants.jobName.CREATE_ELASTICSEARCH_WEBINAR);
    AMPQ.initQueue(globalConstants.jobName.DELETE_ELASTICSEARCH_WEBINAR);
    AMPQ.initQueue(globalConstants.jobName.LIVESTREAM_ACTION, false);
    AMPQ.initQueue(globalConstants.jobName.JOIN_WEBINAR_AFTER_PAY);
    AMPQ.initQueue(WORKER_NAME.SEND_MAIL);
    AMPQ.initQueue(WORKER_NAME.ROOM_HOOK);
    AMPQ.initQueue(WORKER_NAME.ROOM_RECORDED_HOOK);

    logger.info('AMPQ queue is running...');
    return true;
  } catch (error) {
    logger.error('AMPQ: createQueue initChannel error:');
    logger.error(error.toString());
    throw error;
  }
}

export async function createWorkers() {
  try {
    await AMPQ.initChannel();
    require('./worker.ampq');
    logger.info('AMPQ worker is running...');
    return true;
  } catch (error) {
    logger.error('AMPQ: createWorkers initChannel error:');
    logger.error(error.toString());
    throw error;
  }
}

export function createRedisWorkers() {
  // require('./ChatBotWorker');
  require('./Engagements/ViewEngagementWorker');
  require('./Engagements/KnowledgeUpvoteEngagementWorker');
  require('./Engagements/KnowledgeCommentEngagementWorker');
  require('./Engagements/SessionEngagementWorker');
  require('./EmailWorker');
  require('./QuestionWorker');
  require('./SkillWorker');
  require('./UserWorker');
  require('./PaymentHistoryWorker');
  require('./MessageWorker');
  require('./FeedWorker');
  require('./CourseWorker');
  require('./ScheduleWorker');
  require('./RefundWorker');
  require('./KnowledgeWorker');
  require('./AffiliateHistoryWorker');
  require('./VoIPWorker');
  require('./interactWorker');
  require('./TicketWorker');
  require('./MemberShipWorker');
  require('./RenewWorker');
}
