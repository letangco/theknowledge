import mongoose from 'mongoose';
import globalConstants from '../../config/globalConstants';
import AMPQ from '../../rabbitmq/ampq';

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    cuid:      { type: 'String', required: true },
    chatGroup: { type: 'String', required: true },
    userSend:  { type: 'String', required: true },
    // Type: msg || call || chat || files || experts
    type:      { type: 'String', required: true, default: 'msg',enum:['msg','call','chat','files','experts'] },
    content:   { type: 'Mixed',  required: true },
    time:      { type: 'Date',   required: true, default: Date.now },
    buttons:   { type: [String]}
});

messageSchema.post('save', async (created, next) => {
  AMPQ.sendDataToQueue(globalConstants.jobName.PUSH_MSG_NOTIFY_TO_USER, created);
  return next();
});

export default mongoose.model('Message', messageSchema);
