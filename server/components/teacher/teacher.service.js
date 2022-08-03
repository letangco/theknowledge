import Course from '../../models/courses';
import ExerciseWritingReport from '../../models/exerciseWritingReport';
import ExerciseMultipleChoiceReport from '../../models/exerciseMultipleChoiceReport';
import ExerciseMultipleChoiceUploadReport from '../../models/exerciseMultipleChoiceUploadReport';
import logger from '../../util/log';
import { getObjectId } from '../../util/string.helper';

export async function countTotalCourse(teacherId) {
  try {
    return await Course.count({ creator: teacherId });
  } catch (error) {
    logger.error('TeacherService, countTotalCourse error:');
    logger.error(error);
    throw error;
  }
}

export async function countTotalExercise(teacherId) {
  try {
    const writingCount = await ExerciseWritingReport.count({ user: teacherId });
    const multipleChoiceCount = await ExerciseMultipleChoiceReport.count({ user: teacherId });
    const multipleChoiceUploadCount = await ExerciseMultipleChoiceUploadReport.count({ user: teacherId });
    return {
      writingCount: writingCount,
      multipleChoiceCount: multipleChoiceCount,
      multipleChoiceUploadCount: multipleChoiceUploadCount,
      total: writingCount + multipleChoiceCount + multipleChoiceUploadCount,
    }
  } catch (error) {
    logger.error('TeacherService, countTotalExercise error:');
    logger.error(error);
    throw error;
  }
}

export async function countTotalUserRegistryCourse(teacherId) {
  try {
    const aggResult = await Course.aggregate([
      {
        $match: { creator: getObjectId(teacherId) },
      },
      {
        $lookup: {
          from: 'usertocourses',
          foreignField: 'course',
          localField: '_id',
          as: 'userToCourses',
        }
      },
      {
        $unwind: '$userToCourses',
      },
      {
        $count: 'total',
      },
    ]);
    return aggResult?.total ?? 0;
  } catch (error) {
    logger.error('TeacherService, countTotalUserRegistryCourse error:');
    logger.error(error);
    throw error;
  }
}

export async function calcTotalIncome(teacherId) {
  try {
    const aggResult = await Course.aggregate([
      {
        $match: { creator: getObjectId(teacherId) },
      },
      {
        $lookup: {
          from: 'historycarts',
          foreignField: 'info.courses._id',
          localField: '_id',
          as: 'carts',
        }
      },
      { $unwind: '$carts' },
      { $replaceRoot: { newRoot: '$carts.info' } },
      { $unwind: '$courses' },
      { $replaceRoot: { newRoot: '$courses' } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$price_discount' },
        }
      }
    ]);
    return aggResult?.totalIncome ?? 0;
  } catch (error) {
    logger.error('TeacherService, calcTotalIncome error:');
    logger.error(error);
    throw error;
  }
}

export async function getTeacherDashboardReport(teacherId) {
  try {
    return {
      totalCourse: await countTotalCourse(teacherId),
      totalExercise: await countTotalExercise(teacherId),
      totalUserRegistryCourse: await countTotalUserRegistryCourse(teacherId),
      totalIncome: await calcTotalIncome(teacherId),
    };
  } catch (error) {
    logger.error('TeacherService, calcTotalIncome error:');
    logger.error(error);
    throw error;
  }
}
