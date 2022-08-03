import UserOption from '../models/userOption.js';
import User from '../models/user.js';
import {checkTokenUser} from './user.controller.js';
import sanitizeHtml from 'sanitize-html';
import cuid from 'cuid';

export function add(req, res) {
  var userInfo = new UserOption(req.body.userOption);
  var token = req.body.token;
  var field = req.body.field;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  if (userInfo) {
    // Add or update item.
    Promise.resolve(checkTokenUser(token, userInfo.userID)).then((checkUser) => {
      if (checkUser) {
        UserOption.findOne({userID: userInfo.userID}).exec((err, user) => {
          if (err) {
            result.key = -1;
            result.message = 'System error.';
            res.json({result});
          } else {
            if (user === null) {
              //Add new item.
              userInfo.save((err) => {
                if (err) {
                  result.key = -2;
                  result.message = 'System error.';
                  res.json({result});
                } else {
                  result.key = 1;
                  result.message = 'Success.';
                  res.json({result});
                }
              });
            } else {
              //Update item.
              UserOption.update(
                {userID: userInfo.userID},
                {
                  $set: {
                    [field]: userInfo[field]
                  }
                }
              ).exec((err, user) => {
                if (err) {
                  result.key = -3;
                  result.message = 'System error.';
                  res.json({result});
                } else {
                  result.key = 1;
                  result.message = 'Success';
                  res.json({result});
                }
              });
            }
          }
        });
      } else {
        //Check token failed.
        result.key = -4;
        result.message = 'Token error.';
        res.json({result});
      }
    });
  } else {
    result.key = -5;
    result.message = 'Data empty.';
    res.json({result});
  }
}

export function getOptionByUserID(req, res) {
  var userID = req.params.userID;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  UserOption.findOne({userID: userID}).exec((err, userOption) => {
    if (err) {
      result.key = -1;
      result.message = 'System error.';
      res.json({result});
    } else {
      result.key = 1;
      result.message = 'Success.';
      if (userOption === null) {
        userOption = new UserOption();
        userOption.userID = userID;
      }
      result.data = userOption;
      res.json({result});
    }
  });
}

export function checkOptionNotify(userID) {
  return new Promise((resolve) => {
    UserOption.findOne({userID: userID}).exec((err, userOption) => {
      if (err) {
        resolve(false);
      } else {
        if (userOption === null || userOption.notifications.notification != 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

export function checkOptionSendMail(userID) {
  return new Promise((resolve) => {
    UserOption.findOne({userID: userID}).exec((err, userOption) => {
      if (err) {
        resolve(false);
      } else {
        if (userOption === null || userOption.notifications.notification != 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

export function updateLanguageSetting(req, res) {
  let userCuid = req.user.cuid;
  let langId = req.query.langId;
  if ( langId ) {
    try {
      UserOption.update({userID: userCuid}, {$set: { language: langId }}, {upsert: true},
        function ( error, numberAffected ) {
          if ( error ) {
            res.status(500).send({error});
          } else {
            res.status(200).json({success: true, numberAffected});
          }
        });
    } catch ( error ) {
      res.status(500).json({error});
    }
  } else {
    res.status(400).json({
      error: 'LangId not found'
    });
  }
}
