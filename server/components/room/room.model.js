import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const roomSchema = new Schema({
  stream: { type: Schema.ObjectId, ref: 'LiveStream', required: true },
  meetingName: { type: String },
  meetingID: { type: String, required: true },
  internalMeetingID: { type: String, required: true },
  voiceBridge: { type: Number },
  dialNumber: { type: String },
  attendeePW: { type: String, required: true },
  moderatorPW: { type: String, required: true },
  running: { type: Boolean },
  duration: { type: Number, default: 0 },
  hasUserJoined: { type: Boolean },
  recording: { type: Boolean },
  hasBeenForciblyEnded: { type: Boolean },
  startTime: { type: Number },
  endTime: { type: Number },
  participantCount: { type: Number },
  listenerCount: { type: Number },
  voiceParticipantCount: { type: Number },
  videoCount: { type: Number },
  maxUsers: { type: Number },
  moderatorCount: { type: Number },
  isBreakout: { type: Boolean },
  attendees: [
    {
      userID: { type: Schema.ObjectId, required: true },
      fullName: { type: String },
      role: { type: String, enum: ['MODERATOR', 'VIEWER'] },
      isPresenter: { type: Boolean },
      hasJoinedVoice: { type: Boolean },
      hasVideo: { type: Boolean },
      clientType: { type: String, enum: ['FLASH', 'HTML5'] },
    }
  ],
  metadata: {
    'bbb-origin-version': { type: String },
    'bbb-origin-server-name': { type: String },
  },
}, {
  timestamps: true,
});

export default mongoose.model('Room', roomSchema);
