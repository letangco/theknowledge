import mongoose from 'mongoose';
import globalConstants from '../../config/globalConstants';

const Schema = mongoose.Schema;

const userPaymentMethodSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true},
  type: {
    type: 'string',
    enum: ['paypal', 'SWIFT'],
    required: true
  },
  detail : {type: Object},
  dateAdded : {type: 'Date', default: Date.now, required: true},
  dateUpdated : {type: 'Date'}
});

userPaymentMethodSchema.index({dateAdded: -1});
userPaymentMethodSchema.index({user: 1});

userPaymentMethodSchema.statics.addNew = async function(_this, user, payload) {
  let type = payload.type;
  let detail = payload.detail;

  if(type === 'paypal') {
    let count = await _this.count({
      user: user._id,
      type: type,
      'detail.emailPaypal': detail.emailPaypal
    });

    if(count) {
      return Promise.reject({err: 'added', message: "This method's been already added."});
    }
  }

  let created = await _this.create({
    user: user._id,
    type: type,
    detail: detail
  });

  if((payload.default && payload.default !== 'false') || !user.defaultPaymentMethod) {
    user.defaultPaymentMethod = created._id;
    await user.save();
  }

  return created;
};

export default mongoose.model('UserPaymentMethod', userPaymentMethodSchema);
