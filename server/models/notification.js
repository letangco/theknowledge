import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    userID: {type: String, required: true},
    notifyList: [
        {
            notifyID: {type: String},
            userSendID: {type: String},
            notifyType: {type: String},
            notifyInfo: {type: Object},
            viewStatus: {type: Number, default: 1},
            status: {type: Number, default: 1},
            dateAdded: {type: Date, default: Date.now}
        }
    ],
    messageGroup: {type: Array},
    messageGroupInfo: {type: Array}
});

export default mongoose.model('Notification', notificationSchema);
