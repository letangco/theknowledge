import User from '../../models/user';
import LiveStream from '../../models/liveStream';
import globalConstants, {RABBITMQ_RESTART_AFTER} from '../../../config/globalConstants';
import config from '../../../server/config';
import { broadcastToRoom } from '../../controllers/ant.controller';
import {resetUnCommitStream} from '../../controllers/liveStream.controller';
import {bookWebinarTicket} from "../../services/webinarTicket.services";
import * as liveStream_Services from '../../services/liveStream.services';
import AMPQ from '../../../rabbitmq/ampq';
import Elasticsearch from '../Elasticsearch';

AMPQ.consumeData(globalConstants.jobName.CREATE_ELASTICSEARCH_WEBINAR, async (msg, channel) =>{
  try {
    let data = JSON.parse(msg.content.toString());
    data = await liveStream_Services.buildElasticDoc(data);
    Elasticsearch.index('webinars', data);
    return channel.ack(msg);
  } catch (error){
    console.error('CREATE_ELASTICSEARCH_WEBINAR error:');
    console.error(error);
    setTimeout(() => {
      channel.nack(msg);
    }, RABBITMQ_RESTART_AFTER);
  }
}, {
  noAck: false,
});

AMPQ.consumeData(globalConstants.jobName.DELETE_ELASTICSEARCH_WEBINAR, async (msg, channel) => {
  try {
    let data = JSON.parse(msg.content.toString());
    Elasticsearch.delete('webinars',data._id.toString());
    return channel.ack(msg);
  } catch (error){
    console.error('DELETE_ELASTICSEARCH_WEBINAR error:');
    console.error(error);
    setTimeout(() => {
      channel.nack(msg);
    }, RABBITMQ_RESTART_AFTER);
  }
}, {
  noAck: false,
});

AMPQ.consumeData(globalConstants.jobName.LIVESTREAM_ACTION, async (msg, channel) => {
  try {
    let streamingData = {};
    /*Than: job.data.obj is object type*/
    let data = JSON.parse(msg.content.toString());
    let content = data.obj;
    if(data.type) {
      switch (data.type) {
        case 'comment':
          let user = await User.formatBasicInfoById(User, content.user);
          content.user = user;
          streamingData = {
            data: content,
            type: 'comment'
          };
          break;
        case 'getTotalVote':
          streamingData = {
            data: {
              count: content.count,
              liveStream: content.liveStream
            },
            type: 'getTotalVote'
          };
          break;
        case 'currentView':
          // If want to get userInfo, set it to true
          if ( content.userInfo === true && content.user && content.user.userId ) {
            let userInfo = await User.formatBasicInfoById(User, content.user.userId);
            if ( userInfo ) {
              userInfo.status = content.user.status;
            }
            content.userInfo = userInfo;
          }
          streamingData = {
            data: {
              numViewer: content.numViewer,
              totalViewed: content.totalViewed,
              liveStream: content.liveStream,
              user: content.user,
              userInfo: content.userInfo
            },
            type: 'currentView'
          };
          break;
        case 'sendGift':
          let sendGift = content.gift;
          sendGift.from = await User.formatBasicInfoById(User, sendGift.from);
          sendGift.icon = config.gifts[sendGift.gift] ? config.gifts[sendGift.gift].img : null;
          streamingData = {
            data: {
              gift: sendGift,
              liveStream: content.liveStream
            },
            type: 'sendGift'
          };
          await LiveStream.update({_id: sendGift.liveStream}, {$inc: {totalPoints: sendGift.points}});
          break;
        case 'resetUnCommitStream':
          streamingData = {};
          await resetUnCommitStream();
          break;
        default:
          console.log('LIVESTREAM_ACTION data type is not valid');
          console.log(data);
          break;
      }
    }
    let roomId = ( streamingData && streamingData.data ) ? streamingData.data.liveStream : null;
    if ( roomId ) {
      broadcastToRoom(roomId, 'liveStreamAction', streamingData, {
        includeSender: true
      });
    }
    return true;
  } catch (error) {
    console.error('LIVESTREAM_ACTION error:');
    console.error(error);
    return true;
  }
});

AMPQ.consumeData(globalConstants.jobName.JOIN_WEBINAR_AFTER_PAY, async (msg, channel) => {
  try {
    let payment = JSON.parse(msg.content.toString());
    let couponCode = payment.paymentInfo.data.couponCode || '';
    let contactInfo = payment.paymentInfo.data.contactInfo;
    let langCode = payment.paymentType === 'vtcPay' ? 'vi' : 'en';
    let user = await User.findOne({cuid: payment.userId}, '_id').lean();
    if(!user) {
      return Promise.reject({success: false, error: 'User not found.'});
    }

    let promises = payment.paymentInfo.data.tickets.map(async ticket => {
      return await bookWebinarTicket(user._id, ticket.ticket_id, ticket.quantity, langCode, contactInfo, payment.affCode, couponCode);
    });
    await Promise.all(promises);

    return channel.ack(msg);
  } catch (error) {
    console.error('JOIN_WEBINAR_AFTER_PAY error:');
    console.error(error);
    setTimeout(() => {
      channel.nack(msg);
    }, RABBITMQ_RESTART_AFTER);
    return error;
  }
}, {
  noAck: false,
});
