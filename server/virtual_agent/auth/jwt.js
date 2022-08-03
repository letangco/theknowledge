import { JWT, CreateAuth } from '@tggs/core-authencation';
import CONFIG from '../../config';
import User from '../../models/user';
import Agent from '../../models/agentInfo';
import globalConstants from '../../../config/globalConstants';

const ONE_HOUR = 3600;
const ONE_DAY = ONE_HOUR * 24;

export const jwt_user = new JWT({
    jwtKey: CONFIG.jwtSecret,
    expiredTime: ONE_DAY
});

/**
 * JWT User
 * */
 export const isUser = new CreateAuth('user', jwt_user.getJWTKey(), 'bearer', async (token, done) => {
  try {
    const user = await User.findOne({ _id: token._id.toString(), role: globalConstants.role.USER }).select({ password: 0 });
    const agent = await Agent.findOne({ _id: token._id }).select({ password: 0 });
    if (!user && !agent) {
      return done(null, false);
    }
    if (agent) {
      return done(null, {
        _id: agent.user,
        agentId: agent._id,
        role: agent.role
      });
    } else {
      return done(null, {
        _id: user._id,
        role: user.role
      });
    }
  } catch (e) {
    return done(e);
  }
});

/**
 * JWT Agent
 * */
 export const isAgent = new CreateAuth('agent', jwt_user.getJWTKey(), 'bearer', async (token, done) => {
  try {
    const agent = await Agent.findOne({ _id: token._id.toString() }).select({ password: 0 });
    if (!agent?._id) {
      return done(null, false);
    }
    return done(null, {
      _id: agent._id,
      role: agent.role
    });
  } catch (e) {
    return done(e);
  }
});
