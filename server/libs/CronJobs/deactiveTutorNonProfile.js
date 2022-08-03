import UserModel from '../../models/user';
import configs from '../../config';
import mongoose from 'mongoose';

export async function DeActiveAccNonProfileTutor() {
    try {
        let users = {};
        let conditions = [];
        let generalQuery = {
            expert: 1,
            _id: {
              $nin: [
                mongoose.Types.ObjectId(configs.supportAccounts.tesseSupport._id),
                mongoose.Types.ObjectId(configs.supportAccounts.customerSupport._id),
                mongoose.Types.ObjectId(configs.chloeAccount),
              ]
            },
            email: {
              $ne: configs.chloeEmail
            },
            $or: [{avatar: {$exists: false}}, { aboutUs: {$in: ['', '<p></p>', '<p></p>\n', '<p></p>\\n']} }, { aboutUs: {$exists: false}}, { avatar: {$in: ['']} }]
        };
        conditions.push(generalQuery);
        let fields = ['fullName', 'code', 'cuid', 'email', 'firstName', 'lastName', 'userName', 'dateAdded', 'becomeExpertRequest', 'expert'].join(' ');
        if (conditions.length > 0) {
            users = await UserModel.find({ $or: conditions }, fields).exec();
        } else users = [];
        const timeNow = new Date();
        if (users.length > 0) {
            users.map(async (user) => {
                if(user){
                    const time = new Date(user?.dateAdded);
                    const diff = timeNow - time;
                    if (Math.floor(parseInt(diff) / 60e3) >= 1440 * 14) {
                        user.expert = -1;
                        await user.save();
                    }
                }
            });
        }
    } catch (error) {
        console.log('error send email to tutor non profile: ', error);
    }
}

export default {
    cronTime: configs?.trackingTimeCheckUpdateTutorProfile || '0 59 23 * * *',
    onTick: async () => {
        console.log('start cron job un active tutor non profile');
        await Promise.all([
            DeActiveAccNonProfileTutor()
        ]).then(() => {
            console.log('cron job backup done.');
        }).catch(err => console.log(err));
    },
    start: true
};
