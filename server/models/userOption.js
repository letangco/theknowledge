import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userOptionSchema = new Schema({
    userID: {type: String},
    notifications: {
        follow : {type: Number, default: 1},
        message : {type: Number, default: 1},
        notification : {type: Number, default: 1}
    },
    privacy: {searchMode: {type: Number, default: 1}},
    language: {type: String},
    dateAdd: {type: Date, default: Date.now}
});
export default mongoose.model('UserOption', userOptionSchema);
