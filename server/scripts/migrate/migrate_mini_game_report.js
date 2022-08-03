import ReportMiniGame from '../../models/reportGameMini';
import User from '../../models/user';

export async function migrateUserCandy() {
  try {
    // let data = await ReportMiniGame.aggregate([
    //   {
    //     $match: {
    //       correct: true
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: "$user",
    //       total: {
    //         $sum: "$candy"
    //       }
    //     }
    //   }
    // ]);
    let data = await User.find({});
    let promise = data.map(async e => {
      // let user = await User.findById(e._id);
      // user.candy = {
      //   total: e.total,
      //   current: e.total
      // };
      e.candy.current = e.candy.total
      await e.save();
    });
    await Promise.all(promise);
  } catch (err) {
    console.log('error migrateUserCandy : ', err)
  }
}
