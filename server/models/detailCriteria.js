import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const detailCriteriaSchema = new Schema({
    rateId: {type: Schema.ObjectId, ref: 'ratings'},
    criteriaId: {type: Schema.ObjectId, ref: 'criterias'},
    rate: {type: Number, default: 0}
});

detailCriteriaSchema.index({rateId: 1, criteriaId: 1});

export default mongoose.model('DetailCriteria', detailCriteriaSchema);
