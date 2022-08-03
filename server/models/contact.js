import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const contactSchema = new Schema({
    information: {type: Object}
});

export default mongoose.model('Contact', contactSchema);
