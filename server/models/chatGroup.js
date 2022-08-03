import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const chatGroupSchema = new Schema({
  cuid:   { type: 'String', required: true },
  // List user in this Group, current building for 2 users in on Group
  users:    [{
    cuid: {type: 'String', required: true},
    fullName: {type: 'String', required: true} // FullName of user
  }],
  // Content some needed info (name, avatar) of user to display for Group
  userInfo: { type: 'Mixed', required: true },
  // Use when one of users set name for this Group, this have Priority larger than userInfo name
  name:     { type: 'String' },
  // The last time this room receive message, use to sort chat room by time active
  lastTimeActive: { type: 'Date', default: Date.now, required: true },
  // The last message in this group. Is undefined when have no massage before
  lastMessage: { type: 'Mixed' },
  //
  userViewInfo: {type: Array},

  context:   {
    type: 'String',
    enum: ['normal', 'training', 'findingExperts'],
    required: true,
    default: 'normal'
  },
});

export default mongoose.model('ChatGroup', chatGroupSchema);
