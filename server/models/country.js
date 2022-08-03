import mongoose from 'mongoose';
import cuid from 'cuid';

const Schema = mongoose.Schema;

const countrySchema = new Schema({
    name          :     { type: 'String'},
    ISO2          :     { type: 'String'},
    ISO3          :     { type: 'String'},
    dateAdded     :     { type: 'Date', default: Date.now, required: true },
    dateModified  :     { type: 'Date', default: Date.now},
    cuid          :     { type: 'String', required: true, default: cuid }
});

export default mongoose.model('Country', countrySchema);
