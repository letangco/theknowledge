import User from '../../models/user.js';

const authByToken = async token => {
    try {
        let user = await User.findOne({$and: [{token: token}, {token: {$ne: null}}]}, 'cuid role').exec();
        if ( !user ) {
            return {error: 'User not found', result: null};
        }
        return {error: null, result: user};
    } catch (e) {
        return {error: e, result: null};
    }
};

export default authByToken;