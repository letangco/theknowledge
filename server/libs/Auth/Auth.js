import passport from 'passport';
import passportToken from 'passport-unique-token';
import User from '../../models/user.js';
import LiveStream from '../../models/liveStream';
import Course from '../../models/courses';

let TokenStrategy = passportToken.Strategy;
let strategyOpts = {
    tokenHeader: 'token'
};

let strategy = new TokenStrategy(async (token, done) => {
    try {
        let user = await User.findOne({ token: token }, 'cuid role memberShip teacherMembership').exec();
        if (!user) {
            return done(null, false);
        }
        return done(null, user);
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
        return passport.authenticate('token', {session: false});
    },
    // checkLogin: async (req, res, next) => {
    //   let token = req.headers && req.headers.token ? req.headers.token : req.query.token ? req.query.token : '';
    //   if(!token) {
    //     return next();
    //   }
    //
    //   try {
    //     // console.log('verify:', token);
    //     // let data = await jwToken.verify(token); // This is the decrypted token or the payload you provided
    //     // if (data) req.user = data;
    //     req.user = await User.findOne({token}, 'role');
    //     // console.log('user:', user);
    //     // req.user.role = user.role;
    //     // console.log('req.user:', req.user);
    //     return next();
    //   } catch (err) {
    //     return next();
    //   }
    // }
};
//
export async function checkLogin(req, res, next) {
  let token = req.headers && req.headers.token ? req.headers.token : req.query.token ? req.query.token : '';
  if(!token) {
    return next();
  }

  try {
    // console.log('verify:', token);
    // let data = await jwToken.verify(token); // This is the decrypted token or the payload you provided
    // if (data) req.user = data;
    req.user = await User.findOne({token}, 'role memberShip teacherMembership');
    // console.log('user:', user);
    // req.user.role = user.role;
    // console.log('req.user:', req.user);
    return next();
  } catch (err) {
    return next();
  }
}

export function isAuth(req, res, next) {
  if (req.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    err: 'You are not logged in.'
  });
}

export function isAdminV2(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    err: 'Permission denied.'
  });
}
// export async function checkPermission(liveStream, userInfo) {
//   if(!userInfo) {
//     return (liveStream.privacy.to === 'custom' || liveStream.privacy.to === 'me') ? 'denied' : 'viewer';
//   }
//   if (userInfo._id.toString() === liveStream.user.toString()) {
//     return 'presenter';
//   }
//   if (liveStream.privacy.to === 'me' ||
//     (liveStream.privacy.to === 'custom' &&
//       liveStream.privacy.invited.indexOf(userInfo._id.toString()) < 0
//     )) {
//     if(!liveStream.course){
//       return 'denied';
//     }
//     let courseInfo = await Course.findById(liveStream.course, 'lectures').lean();
//     if(courseInfo && courseInfo.lectures && courseInfo.lectures.length > 0){
//       if(courseInfo.lectures.indexOf(userInfo._id.toString()) >= 0){
//         return 'presenter';
//       }
//       if(userInfo.memberShip && userInfo.memberShip > new Date().getTime()){
//         return 'viewer';
//       }
//         return 'denied';
//     }
//     if(userInfo.memberShip && userInfo.memberShip > new Date().getTime()){
//       return 'viewer';
//     }
//     return 'denied';
//   }
//   return 'viewer';
// }
export async function checkStreamPermission(req, res, next) {
  try{
    let liveStream = await LiveStream.findById(req.params.id, 'user privacy course').lean();
    if(!liveStream) {
      return res.status(404).json({success: false, error: 'Live Stream not found.'});
    }
    if(!req.user) {
      req.permission = (liveStream.privacy.to === 'custom' || liveStream.privacy.to === 'me') ? 'denied' : 'viewer';
    } else {
      if (req.user._id.toString() === liveStream.user.toString()) {
        req.permission = 'presenter';
      } else if (liveStream.privacy.to === 'me' ||
        (liveStream.privacy.to === 'custom' &&
          liveStream.privacy.invited.indexOf(req.user._id.toString()) < 0
        )) {
          if(!liveStream.course){
            req.permission = 'denied';
          } else{
            let courseInfo = await Course.findById(liveStream.course, 'lectures').lean();
            if(courseInfo && courseInfo.lectures && courseInfo.lectures.length > 0){
              let checked = false;
              let promises = courseInfo.lectures.map(async item => {
                if(item.toString() === req.user._id.toString()){
                  checked = true;
                  req.permission = 'presenter';
                }
              });
              await Promise.all(promises);
              if(!checked){
                if(req.user.memberShip && req.user.memberShip > new Date().getTime()){
                  req.permission = 'viewer';
                } else {
                  req.permission = 'denied';
                }
              }
            } else if(req.user.memberShip && req.user.memberShip > new Date().getTime()){
              req.permission = 'viewer';
            } else {
              req.permission = 'denied';
            }
          }
      } else {
        req.permission = 'viewer';
      }
    }
    //console.log('req.permission: ', req.permission)
    return next();
  } catch (err) {
    return next();
  }
}
