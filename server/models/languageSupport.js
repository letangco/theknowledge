import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import cuid from 'cuid';

const languageSupportSchema = new Schema({
    name          :     { type: 'String'},
    code          :     { type: 'String'},
    level         :     {type: Array},
    dateAdded     :     { type: 'Date', default: Date.now, required: true },
    dateModified  :     { type: 'Date', default: Date.now},
    cuid          :     { type: 'String', required: true, default: cuid }
});

export default mongoose.model('LanguageSupport', languageSupportSchema);
