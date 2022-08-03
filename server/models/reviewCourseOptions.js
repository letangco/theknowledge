import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const reviewCourseOptionSchema = new Schema({
  parent: {type: Schema.ObjectId, ref: 'reviewcourseoptions', index: true},
  data: [
    {
      languageID : String,
      name: String
    }
  ],
});

export default mongoose.model('ReviewCourseOption', reviewCourseOptionSchema);
