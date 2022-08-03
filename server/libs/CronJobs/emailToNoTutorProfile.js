import UserModel from '../../models/user';
import configs from '../../config';
import { adminSendEmail } from '../../controllers/user.controller';
import mongoose from 'mongoose';

export async function SendEmailToTutorNonProfile() {
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
        let fields = ['fullName', 'code', 'cuid', 'email', 'firstName', 'lastName', 'userName', 'dateAdded', 'becomeExpertRequest'].join(' ');
        if (conditions.length > 0) {
            users = await UserModel.find({ $or: conditions }, fields).exec();
        } else users = [];
        if (users.length > 0) {
            users.map((user) => {
                if(user){
                    adminSendEmail(user, 'TheKnowledge.AI reminder: Tutor profile required!',
                    `<p>Hello ${user.fullName},</p>
                    <p>Please take 5 minutes to update your profile at https://theknowledge.ai/edit-profile-expert within 14 days (Avatar & About me are most needed). After this time, your account will be deactivated</p>
                    <p>---------------</p>
                    <p>TheKnowledge.Ai Team</p>
                    <p>Website: https://theknowledge.ai</p>
                    <p>Email: Hello@theknowledge.ai</p>`,
                    '');
                }
            });
        }
    } catch (error) {
        console.log('error send email to tutor non profile: ', error);
    }
}

export default {
    cronTime: configs?.sendEmailtoTutorNonProfile || '0 0 */2 * *',
    onTick: async () => {
        console.log('start cron job send email to tutor non profile');
        await Promise.all([
            SendEmailToTutorNonProfile()
        ]).then(() => {
            console.log('cron job backup done.');
        }).catch(err => console.log(err));
    },
    start: true
};
