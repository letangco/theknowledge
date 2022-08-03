import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const subscriptionSchema = new Schema({
    name: {type: 'String'},
    phone: {type: 'String'},
    email: {type: 'String'}
});

export default mongoose.model('Subscription', subscriptionSchema);
