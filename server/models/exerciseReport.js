import mongoose from 'mongoose';
import User from './user';
import Lesson from './liveStream';
import ExerciseBBC from './exerciseBBC';
import ExerciseVOA from './exerciseVOA';
import ExerciseReadingKeyWord from './exerciseReadingKeyWord';
import ExerciseMatching from './exerciseMatching';
import ExerciseWriting from './exerciseWriting';
import ExerciseWritingIELTS from './exerciseWritingIELTS';
import ExerciseMultiple from './exerciseMultipleChoice';
import FirstTest from './firstTest';
import {
  addExerciseBBC,
  addExerciseMatching, addExerciseMultiple,
  addExerciseReadingKeyword,
  addExerciseVOA, addExerciseWriting, addExerciseWritingIELTS
} from "../services/exercise.services";
const Schema = mongoose.Schema;

const exerciseReportSchema = new Schema({
  result: { type: Schema.ObjectId, required: true },
  exercise: { type: Schema.ObjectId, required: true },
  lesson: { type: Schema.ObjectId, required: true },
  course: { type: Schema.ObjectId, required: true },
  content: { type: 'String', required: true },
  user: { type: Schema.ObjectId, required: true},
  status: { type: 'Number', enum: [0, 1], default: 0 }, // 0: pending, 1: teacher seen
  type: { type: 'Number', required: true},
}, {
  timestamps: true
});

exerciseReportSchema.statics.getMetaDataReport = async function (reports) {
  try {
    if(!Array.isArray(reports)) {
      reports = [reports];
    }
    let promise = reports.map( async report => {
        let user = await User.findById(report.user).lean();
        let lesson = await Lesson.findById(report.lesson).lean();
        let exercise = {}
        switch (report.type) {
          case 1:
            exercise = await ExerciseBBC.findById(report.exercise);
            break;
          case 2:
            exercise = await ExerciseVOA.findById(report.exercise);
            break;
          case 3:
            exercise = await ExerciseReadingKeyWord.findById(report.exercise);
            break;
          case 4:
            exercise = await ExerciseMatching.findById(report.exercise);
            break;
          case 5:
            exercise = await ExerciseWriting.findById(report.exercise);
            break;
          case 6:
            exercise = await ExerciseWritingIELTS.findById(report.exercise);
            break;
          case 7:
            exercise = await ExerciseMultiple.findById(report.exercise);
          case 8:
            exercise = await FirstTest.findById(report.exercise);
            break;
          default:
            break;
        }
        report.user = user.fullName;
        report.lesson = lesson.title;
        report.exercise = exercise.title;
        return report;
    })
    let data = await Promise.all(promise);
    console.log(data);
    return data.length === 1 ? data[0] : data;
  } catch (error) {
    console.log('error get meta data exercise report : ', error);
    throw error;
  }
}

export default mongoose.model('ExerciseReport', exerciseReportSchema);
