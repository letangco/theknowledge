import mongoose from 'mongoose';
import Rating from './rating';
import DetailRating from './detailRating';
import ArrayHelper from '../util/ArrayHelper';
import Skill from './skill';
import Category from './category';
import {formatCategoryByLanguage} from "../controllers/category.controller";
import globalConstants from '../../config/globalConstants';
import {checkTimeRedelete} from './functions';
import cuid from 'cuid';
import {generateInviteCode} from './functions'
import Elasticsearch from '../libs/Elasticsearch';
import {cacheImage} from '../libs/imageCache'
const Schema = mongoose.Schema;
import User from './user';

const userSchema = new Schema({
  cuid: {type: 'String', required: true},
  code: {type: 'String', required: true},
  unReceiveNotify : {type:'Number', default:0},
  userName: {type: 'String', default: ''},
  idSocial: {type: 'String'},
  typeSocial: {type: 'String', default: ''},
  email: {type: 'String'},
  role: {type: 'String', default: globalConstants.role.USER},
  telephone: {type: 'String', default: ''},
  password: {type: 'String', default: ''},
  token: {type: 'String', default: ''},
  active: {type: 'Number', default: 0},
  tokenActive: {type: 'String'},
  tokenForgot: {type: 'String'},
  dateExpired: {type: 'String'},
  firstName: {type: 'String', default: ''},
  lastName: {type: 'String', default: ''},
  fullName: {type: 'String', default: ''},
  birthday: {day: Number, month: Number, year: Number},
  gender: {type: 'Number', default: 0},
  description: {type: 'Mixed'},
  avatar: {type: 'String', default: ''},
  address: {type: 'String'},
  zone: {type: 'String', default: ''},
  country: {name: String, ISO2: String, ISO3: String, cuid: String},
  zipCode: {type: 'String', default: ''},
  aboutUs: {type: 'String', default: ''},
  socialLink: [{socialName: String, link: String}],
  status: {type: 'Number', default: 0},
  dateAdded: {type: 'Date', default: Date.now, required: true},
  dateModified: {type: 'Date', default: Date.now},
  avatarFile: {type: Object},
  online: {type: 'Number', default: 0}, // 0: offline, 1: online, 2: busy, 3: ready
  dateOffline : {type:Date},
  totalRate: {type: 'Number', default: 0},
  rate: {type: 'Number', default: 0},
  serviceTotalRate: {type: 'Number', default: 0},
  serviceRating: {
    expertCommunication: {type: 'Number', default: 0},
    serviceAsDescribed: {type: 'Number', default: 0},
    professional: {type: 'Number', default: 0},
    notProlong: {type: 'Number', default: 0}
  },
  autoWithdrawl: {type: Boolean, default: false},
  fullWithdrawl: {type: Object},
  categories: [
    {
      catID: String,
      industry: {
        industryID: String,
        title: String
      },
      department: {
        departmentID: String,
        title: String,
        average: {type: Number, default: 0},
        total_rate: {type: Number, default: 0}
      },
      skills: [
        {
          average: {type: Number, default: 0},
          total_rate: {type: Number, default: 0},
          skill_ID: {type: String, default: ''}
        }
      ],
      description: String
    }
  ],
  rating: [{
    date: {type: 'Date', default: Date.now, required: true},
    cuid: {type: 'String', required: true},
    cmt: {type: 'String'},
    skills: [{
      rate: {type: 'Number'},
      skill_ID: {type: 'String'}
    }]
  }],
  reviews: [
    {
      cateCuid: {type: 'String', required: true},
      cateName: {type: 'String', required: true},
      avgRate: {type: 'Number', default: 0},
      numRate: {type: 'Number', default: 0},
      details: [
        {
          skillId: {type: Schema.ObjectId, ref: 'skills', required: true},
          skillName: {type: 'String', required: true},
          avgRate: {type: 'Number', default: 0}
        }
      ]
    }
  ],
  workExperience: [{
    workID: String,
    companyName: String,
    websiteUrl: String,
    location: String,
    position: String,
    startDate: Date,
    endDate: Date,
    workNow: {type: Boolean, default: false},
    details: String
  }],

  education: [{
    eduID: String,
    school: String,
    websiteUrl: String,
    location: String,
    degree: String,
    startDate: Date,
    endDate: Date,
    details: String
  }],
  award: [{awardID: String, organization: String, degree: String, award: String, dateReceived: Date, details: String}],
  languageSupport: [{lsID: String, langName: String, langCuid: String, langLevel: String, langCode: String}],
  expert: {type: 'Number', default: 0},
  priceCall: {type: 'Number', default: 0},
  priceChat: {type: 'Number', default: 0},
  firstMinFree: {type: 'Number', default: 0},
  balance: {type: Number, default: 0},
  paypalAccount: {type: 'String'},
  bankAccount: {type: Object},
  defaultPaymentMethod: {type: Schema.ObjectId, ref: 'userpaymentmethods'},
  birthday1: {type: 'Date', default: Date.now},
  deleteDate: Date,
  skills: {type: [Schema.ObjectId], ref: 'skills'},
  interested_skills: {type: [Schema.ObjectId], ref: 'skills'}, // Skill object id interested when choose of step to view feed of Nam @Nhan note for feed
  interested_skills_views: {Object}, // Data of Nam step, include tree Department and skill it self @Nhan note for feed
  interested_departments: {type: [String]},
  code_verify_email:{type: 'String', default: ''},
  email_change:{type: 'String', default: ''},
  /*
  ex:
  Developer
    |__Html
    |__PHP
  Business
    |__ABC
    |__XYZ
   */

  // begin tracking sessions
  becomeExpertRequest: {type: 'Date'},
  becomeExpert: {type: 'Date'},
  activeDate: {type: 'Date'},
  // end tracking sessions

  deviceTokens: {type: Array}, // We're using FCM services to push notifications for device
  deviceAWSTokens: {type: Array}, // We're using AWS SNS to push VoIP notifications

  // begin invitation sessions
  inviteCode: {type: 'String', unique: true},
  //Than: Tracking token access google contact
  tokenGoogleObj: {type: Object},
  // end invitation sessions
  // Is the user skip pre-feed step
  skipFeed: {type: Boolean, default: false},
  // User Dismiss view tour forever
  dismissTour: {type: Boolean, default: false},
  verifyEmail: {type: Boolean, default: false},
  verifyPhone: {type: Boolean, default: false},

  // affiliate program
  affiliateCode: {type: 'String', index: true},
  points: {type: Number, default: 0},
  memberShip: {type: Number},
  teacherMembership: {type: Number},
  total_course: {type: Number, default: 0},
  total_studying: {type: Number, default: 0},
  point: {type: Object, default: {}},
  pointGoal: {type: Object},
  customerId: {type: 'String'},
  customerIntent: {type: 'String'},
  customerInvoice: {type: 'String'},
  subscription: {type: 'String'},
  card: {type: 'String'},
  candy: {
    total: {type: Number, default: 0},
    current: {type: Number, default: 0}
  }
}, { timestamps: true });
userSchema.index({ 'categories.skills.skill_ID': 'text'}); // schema level
userSchema.index({ token: 1 });

userSchema.pre('save', async function(next) {
  if(this.isNew) {
    let inviteCode, affiliateCode;
    let users = await User.find({}, 'inviteCode affiliateCode').lean();
    let affiliateCodes = [], inviteCodes = [];
    users.forEach(user => {
      affiliateCodes.push(user.affiliateCode);
      inviteCodes.push(user.inviteCode);
    });
    // generate unique invite code
    do {
      inviteCode = generateInviteCode();
    } while (inviteCodes.indexOf(inviteCode) >= 0);

    // generate unique affiliate code
    do {
      affiliateCode = generateInviteCode();
    } while (affiliateCodes.indexOf(affiliateCode) >= 0);

    this.inviteCode = inviteCode;
    this.affiliateCode = affiliateCode;
  }
  return next();
});

userSchema.statics.sortUserSkills = async function(self, options) {
  let fields = [
    'cuid', 'code', 'fullName', 'avatar', 'online', 'rate', 'country', 'userName', 'categories',
    'serviceRating', 'serviceTotalRate', 'priceChat', 'priceCall', 'languageSupport'
  ].join(' ');
  let expertId = options.userId;
  let ratings = await Rating.find({expertId: expertId}, '_id').exec();
  let rateIds = ratings.map(rating => { return rating._id; });
  let aggregated = await DetailRating.aggregate([
    {
      $match: {
        rateId: {$in: rateIds},
        skillId: {$in: options.skillIds}
      }
    },
    {
      $group: {
        _id: "$skillId",
        sum_rate: {$sum: "$rate"}
      }
    },
    {
      $sort: {sum_rate: -1}
    },
    {
      $limit: 6
    }
  ]).exec();
//  aggregated = ArrayHelper.sortByProp(aggregated, 'sum_rate', 'desc');
//    console.log('expertId:', expertId);
//    console.log('aggregated:', aggregated);
  let skillIds = [];
  if(aggregated.length) {
    skillIds = aggregated.map(obj => {return obj._id});
  } else {
    skillIds = options.skillIds.splice(0, 6);
  }

  let finalPromises = [
    self.findById(expertId, fields).exec(),
    Skill.find({_id: {$in: skillIds}}, 'description').exec()
  ];
  let finalPromiseResults = await Promise.all(finalPromises);
  let expert = JSON.parse(JSON.stringify(finalPromiseResults[0]));

  expert.departments = [];
  expert.categories.forEach(cate => {
    if(options.parent) {
      if(cate.industry.industryID === options.cateCuid) {
        expert.departments.push(cate.department.title);
      }
    } else {
      if(cate.department.departmentID === options.cateCuid) {
        expert.departments.push(cate.department.title);
      }
    }
  })

  expert.tagSkills = finalPromiseResults[1].map(skill => {
    return skill.description[0].name;
  });

  delete expert.categories;

  return expert;
};

userSchema.statics.getStatus = function(user) {
  if(user.active === 0) {
    return globalConstants.userStatus.PENDING;
  }

  if(user.active === 1 && user.expert === 0) {
    return globalConstants.userStatus.USER;
  }

  if(user.expert === -1) {
    return globalConstants.userStatus.DEACTIVE;
  }

  if(user.active === -2) {
    if(!user.deleteDate) {
      return globalConstants.userStatus.BANNED;
    }
    if(checkTimeRedelete(user)) {
      return globalConstants.userStatus.PENDING_DEL;
    }
  }

  if(user.active === -1 && !checkTimeRedelete(user)) {
    return globalConstants.userStatus.DELETED;
  }

  if(user.expert === 2) {
    return globalConstants.userStatus.PENDING_EXPERT;
  }

  if(user.expert === 1) {
    return globalConstants.userStatus.EXPERT;
  }
}

userSchema.statics.isExpert = async function(self, userId) {
  let user = await self.findById(userId, 'expert').exec();
  return (user && user.expert === 1);
}

userSchema.statics.upadteGeneralRating = async function(self, userId) {
  let user = await self.findById(userId).lean();
  let total_divable = 0;

  // calc skill rate
  let skillRateDivable = 0, sum_skill_rate = 0;
  user.reviews.forEach(review => {
    if(review.avgRate > 0) {
      skillRateDivable++;
      sum_skill_rate += review.avgRate;
    }
  });
  let skillRate = skillRateDivable ? sum_skill_rate / skillRateDivable : 0;
  if(skillRate) total_divable++;

  // calc service rate
  let serviceRateDivable = 0, sum_service_rate = 0;
  for(let key in user.serviceRating) {
    if(user.serviceRating[key] > 0 && (key != 'ECRate' && key != 'SADRate' && key != 'ProRate' && key != 'NPRate')) {
      // console.log('key:', key);
      // console.log('val:', user.serviceRating[key]);
      serviceRateDivable++;
      sum_service_rate += user.serviceRating[key];
    }
  }
  let serviceRate = serviceRateDivable ? sum_service_rate / serviceRateDivable : 0;
  if(serviceRate) total_divable++;

  user.rate = total_divable ? (serviceRate + skillRate) / total_divable : 0;
  return self.update({_id: userId}, {$set: {rate: user.rate}});
}

userSchema.statics.getMeta = function(userModel) {
  let tags = [];
  let description_a = [], description_b = '';
  let thumbnails = [userModel.avatar];

  if(userModel.reviews) {
    userModel.reviews.forEach(review => {
      let skills = review.details.map(detail => detail.skillName);
      Array.prototype.push.apply(tags, skills);
    });
  }

  if(userModel.categories) {
    userModel.categories.forEach(cate => {
      if(description_a.indexOf(cate.industry.title) < 0) {
        description_a.push(cate.industry.title);
      }
      description_a.push(cate.department.title);
      if(!description_b && cate.description) {
        description_b = cate.description;
      }
    });
  }


  return {
    title : userModel.fullName ? userModel.fullName : userModel.firstName + ' ' + userModel.lastName,
    description : description_a.join(', ') + '. ' + description_b,
    tags : tags,
    type : 'profile',
    thumbnails : thumbnails,
  };
};

userSchema.statics.buildElasticDoc = function(user) {
  let search_test = `${user.fullName} ${user.email}`;
  if(user.userName) search_test += user.userName;
  return {
    id: user._id.toString(),
    search_text: search_test
  };
};

userSchema.statics.syncToElasticSearch = async function(_this, userModel) {
  let doc = _this.buildElasticDoc(userModel);
  await Elasticsearch.update('users', doc, undefined, true);
};

userSchema.statics.removeFromElasticSearch = function(userId) {
  return Elasticsearch.delete('users', userId);
};

userSchema.statics.formatBasicInfo = async function(_this, userIds, selectedFields) {
  let obj = await _this.find({_id: {$in: userIds}, active: 1}, selectedFields || 'cuid userName telephone email avatar fullName expert memberShip').lean();
  let promises = obj.map(async user => {
    if(user && user.avatar){
      let data={
        src: user.avatar,
        size: 50
      };
      let thumb = await cacheImage(data);
      user.avatar = thumb;
    }
    return user;
  });
  obj = await Promise.all(promises);
  return obj;
};

userSchema.statics.formatBasicInfoById = async function(_this, id) {
  let user = await _this.findOne({_id: id, active: 1}, 'cuid code telephone email userName avatar fullName expert').lean();
  if(user && user.avatar){
    let data={
      src: user.avatar,
      size: 50
    };
    user.avatar = await cacheImage(data);
  }
  return user;
};

userSchema.statics.isMemberShip = async function(_this, id) {
  let user = await _this.findOne({_id: id, active: 1}, '').lean();
  if(user){
    return user.memberShip > new Date().getTime();
  }
  return false;
};

userSchema.statics.getCuid = async function(_this, id) {
  let user = await _this.findOne({_id: id, active: 1}, 'cuid').lean();
  if(user && user.cuid){
    return user.cuid;
  }
  return null;
};

userSchema.statics.formatBasicInfoByCuid = async function(_this, cuid) {
  let user = await _this.findOne({cuid: cuid, active: 1}, 'cuid code userName avatar fullName expert').lean();
  if(user && user.avatar){
    let data={
      src: user.avatar,
      size: 50
    };
    user.avatar = await cacheImage(data);
  }
  return user;
};

userSchema.statics.getAllUserBasicInfo = async function(_this) {
  let users = await _this.find({ active: 1}, 'cuid code userName avatar fullName').lean();
  if(users){
    users.map( async user => {
      if(user && user.avatar){
        let data={
          src: user.avatar,
          size: 50
        };
        user.avatar = await cacheImage(data);
      }
      return user;
    })
  }
  return users;
};

userSchema.statics.formatFeedInfo = async function(_this, userIds, langCode, articleCateId) {
  if(!(userIds instanceof Array)) userIds = [userIds];

  let users = await _this.find({_id: {$in: userIds}}, 'cuid code userName avatar fullName expert active categories').lean();

  let promises = users.map(async user => {
    if(user.expert !== 1) {
      delete user.categories;
      return user;
    }
    let cateCuids = user.categories ? user.categories.map(cate => cate.department.departmentID) : [];
    let cates = await Category.find({cuid: {$in: cateCuids}}).lean();
    if(!cates.length) {
      user.categories = [];
    } else {
      let cateIds = [];
      let categories = formatCategoryByLanguage(cates, langCode).map(cate => {
        cateIds.push(cate._id.toString());
        return {title: cate.title, slug: cate.slug};
      });
      let cate = ArrayHelper.getRandomItem(categories);
      if(articleCateId) {
        let articleCateIndex = cateIds.indexOf(articleCateId.toString());
        if (articleCateIndex >= 0) {
          cate = categories[articleCateIndex];
        }
      }
      user.categories = [{title: cate.title, slug: cate.slug}];
    }

    return user;
  });

  return await Promise.all(promises);
};

userSchema.statics.formatLectureInfo = async function (_this, userIds, langCode, articleCateId) {
  if(!(userIds instanceof Array)) userIds = [userIds];

  let users = await _this.find({_id: {$in: userIds}}, 'cuid code userName avatar fullName expert active categories aboutUs').lean();

  let promises = users.map(async user => {
    if(user.expert !== 1) {
      delete user.categories;
      return user;
    }
    let cateCuids = user.categories ? user.categories.map(cate => cate.department.departmentID) : [];
    let cates = await Category.find({cuid: {$in: cateCuids}}).lean();
    if(!cates.length) {
      user.categories = [];
    } else {
      let cateIds = [];
      let categories = formatCategoryByLanguage(cates, langCode).map(cate => {
        cateIds.push(cate._id.toString());
        return {title: cate.title, slug: cate.slug};
      });
      let cate = ArrayHelper.getRandomItem(categories);
      if(articleCateId) {
        let articleCateIndex = cateIds.indexOf(articleCateId.toString());
        if (articleCateIndex >= 0) {
          cate = categories[articleCateIndex];
        }
      }
      user.categories = [{title: cate.title, slug: cate.slug}];
    }

    return user;
  });

  return await Promise.all(promises);
};
// userSchema.statics.formatFeedInfo = async function(_this, userIds, langCode) {
//   if(!(userIds instanceof Array)) userIds = [userIds];
//
//   let users = await _this.find({_id: {$in: userIds}}, 'cuid userName avatar fullName expert active skills').lean();
//
//   let promises = users.map(async user => {
//     if(user.expert !== 1) {
//       delete user.skills;
//       return user;
//     }
//
//     let rates = await Rating.find({expertId: user._id}, '_id').lean();
//     let skillIds = [];
//     if(!rates.length) {
//       skillIds = user.skills.splice(0, 2);
//     } else {
//       let rateIds = rates.map(rate => rate._id);
//       let agg = await DetailRating.aggregate([
//         {
//           $match: {rateId: {$in: rateIds}}
//         },
//         {
//           $group: {_id: "$skillId", _rate: {$sum: "$rate"}}
//         },
//         {
//           $sort: {_rate: -1}
//         },
//         {
//           $limit: 2
//         }
//       ]);
//       skillIds = agg.map(obj => obj._id);
//     }
//
//
//     user.bestSkills = await Skill.formatSuggestData(Skill, skillIds, langCode);
//     delete user.skills;
//     return user;
//   });
//
//   return await Promise.all(promises);
// };

export default mongoose.model('User', userSchema);
