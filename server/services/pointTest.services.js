import slug from "slug";
import PointTest from '../models/pointTest';

export async function getListQuestionPointTestService() {
    try {
      const sortQuestion = [['indexQuestion', 1], ['searchString', 'asc']];
      const promisePoint = await Promise.all([
        PointTest.count({
          parentQuestion: { $exists: false },
          status: true
        }),
        PointTest.find({
          parentQuestion: { $exists: false },
          status: true
        }, '-__v -searchString -indexAnswer -notEligible -content -score').sort(sortQuestion)
      ]);
      let payload;
      if (promisePoint[1].length > 0) {
        const sortAnswer = [['indexAnswer', 1], ['content', 'asc']];
        payload = promisePoint[1].map(async (item) => {
          item = item.toObject();
          const answer = await PointTest.find({
            parentQuestion: { $exists: true, $in: [item._id] },
          }, '-__v -status -subject -question -indexQuestion -special -typeSelect -searchString').sort(sortAnswer);
          item.answers = answer;
          return item;
        });
      } else payload = [];
      return [promisePoint[0], await Promise.all(payload)];
    } catch (error) {
      return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
    }
}