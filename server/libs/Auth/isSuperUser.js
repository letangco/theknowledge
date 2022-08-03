import passport from 'passport';
import passportJWT from 'passport-jwt';
import User from '../../models/user.js';
import configs from '../../config';
import globalConstants from '../../../config/globalConstants';

const JWTStrategy = passportJWT.Strategy;
const extractJwt = passportJWT.ExtractJwt;
const jwtOptions = {
  secretOrKey: configs.jwtSecret,
  jwtFromRequest: extractJwt.fromAuthHeader()
};

let strategy = new JWTStrategy(jwtOptions, async (token, done) => {
  try {
    let user = await User.findOne({_id: token._id, role: globalConstants.role.SUPERUSER}).exec();
    if (!user) {
      return done(null, false);
    }
    let userObj = JSON.parse(JSON.stringify(user));
    delete userObj.password;

    return done(null, userObj);
  } catch (e) {
    return done(e);
  }
});

passport.use(strategy);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

export default {
  init: () => {
    return passport.initialize();
  },
  auth: () => {
    return passport.authenticate('jwt', {session: false});
  }
};
