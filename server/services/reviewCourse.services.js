import LiveStream from '../models/liveStream';
import ReviewCourse from '../models/reviewCourse';
import CommentReviewCourse from '../models/commentReviewCourse';
import Courses from '../models/courses';
import ReviewCourseOptions from '../models/reviewCourseOptions';
import {checkBoughtCourse, formatCourseToReview} from "./course.services";
import User from '../models/user';
import ArrayHelper from '../util/ArrayHelper';
import StringHelper from '../util/StringHelper';
import configs from '../config';

export const REVIEW_LIMIT = 10;

export async function addReviewCourse(reviewptions) {
  try {
    let course = await Courses.findById(reviewptions.course);
    if(!course){
      return Promise.reject({status: 400, success: false, error: 'Course not found.'})
    }
    // let joined = await checkBoughtCourse(reviewptions.user, reviewptions.course);
    // if (!joined) {
    //   return Promise.reject({status: 403, error: 'You have not joined this course yet.'});
    // }
    let star = Number(reviewptions.star).valueOf();
    if (isNaN(star)) {
      return Promise.reject({status: 400, error: 'Invalid star.'});
    }
    if (star < 0) star = 0;
    if (star > 5) star = 5;
    let reviewed;
    if (reviewptions.streamId) {
      reviewed = await ReviewCourse.findOne({user: reviewptions.user, course: reviewptions.course, streamId: reviewptions.streamId});
    } else {
      reviewed = await ReviewCourse.findOne({user: reviewptions.user, course: reviewptions.course});
    }
    if(reviewed){
      reviewed.star = star || reviewed.star;
      reviewed.content = reviewptions.content || '';
      reviewed.options = reviewptions.options || [];
      if(reviewptions.streamId){
        reviewed.streamId = reviewptions.streamId
      }
      reviewptions.createdDate = Date.now();
      reviewed.markModified('options');
      return await reviewed.save();
    } else {
      reviewptions.star = star;
      return await ReviewCourse.create(reviewptions);
    }
    // return await ReviewCourse.create({
    //   user: reviewptions.user,
    //   course: reviewptions.course,
    //   star: star,
    //   content: reviewptions.content,
    //   options: reviewptions.options
    // });
  } catch (err) {
    console.log('err on addReviewCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function addCommentReviewCourse(reviewptions) {
  try {
    let review = await ReviewCourse.findById(reviewptions.review);
    if(!review){
      return Promise.reject({status: 400, success: false, error: 'Review not found.'})
    }
    return await CommentReviewCourse.create(reviewptions);
  } catch (err) {
    console.log('err on addCommentReviewCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
export async function deleteCommentReviewCourse(review) {
  try {
    return await CommentReviewCourse.remove({_id: review})
  } catch (err) {
    console.log('err on deleteCommentReviewCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
export async function getCommentReviewCourse(review) {
  try {
    let comments = await CommentReviewCourse.find({review: review}).lean()
    let promises = comments.map(async comment => {
      comment.user =  await User.formatBasicInfoById(User, comment.user);
      return comment
    })
    return await Promise.all(promises)
  } catch (err) {
    console.log('err on getCommentReviewCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getCourseReviews(courseId, page, langCode) {
  try {
    let course = await Courses.findById(courseId).lean();
    if (!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    let conditions = {course: courseId};
    let skip = (page - 1) * REVIEW_LIMIT;

    let resources = await Promise.all([
      ReviewCourse.count(conditions),
      ReviewCourse.find(conditions, '-options').sort({createdDate: -1}).skip(skip).limit(REVIEW_LIMIT).lean()
    ]);

    let total_items = resources[0], data = await getMetaData(resources[1], langCode);

    return {total_items, data};
  } catch (err) {
    console.log('err on getCourseReviews:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getMetaData(reviewModels, langCode) {
  try {
    if (!(reviewModels instanceof Array)) {
      reviewModels = [reviewModels];
    }
    reviewModels = JSON.parse(JSON.stringify(reviewModels));

    let userIds = reviewModels.map(review => review.user);
    let users = await User.formatBasicInfo(User, userIds);
    let userMapper = ArrayHelper.toObjectByKey(users, '_id');

    let reviewOptions = await ReviewCourseOptions.find().lean();
    reviewOptions = formatReviewOptionsByLanguage(reviewOptions, langCode);
    let reviewMapper = ArrayHelper.toObjectByKey(reviewOptions, '_id');

    let promise = reviewModels.map(async review => {
      review.user = userMapper[review.user];
      if(review.streamId) {
        review.streamId = await LiveStream.findById(review.streamId);
      }

      // review.options = review.options.map(option => {
      //   option.parent = reviewMapper[option.parent];
      //   option.children = option.children.map(child => {
      //     let rs = reviewMapper[child];
      //     return rs || {_id: 'un', title: child};
      //   });
      //   return option;
      // });

      return review;
    });
    reviewModels = await Promise.all(promise);
    return reviewModels;
  } catch (err) {
    console.log('err on getMetaData:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

function formatReviewOptionsByLanguage(reviewOptions, langCode) {
  if (!(reviewOptions instanceof Array)) {
    reviewOptions = [reviewOptions];
  }
  reviewOptions = JSON.parse(JSON.stringify(reviewOptions));
  langCode = langCode || 'en';
  return reviewOptions.map(option => {
    let langIndex = ArrayHelper.findItemByProp(option.data, 'languageID', langCode);
    option.title = option.data[langIndex || 0].name;
    option.slug = option.data[langIndex || 0].slug;
    delete option.data;
    return option;
  });
}

export async function getReviewCourseOptions(options) {
  try {
    let courseId = options.courseId;
    let userId = options.userId;
    let star = options.star;
    let langCode = options.langCode;

    let course = await Courses.findById(courseId, '_id').lean();
    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    let resources = await Promise.all([
      ReviewCourseOptions.find().lean(),
      ReviewCourse.findOne({user: userId, course: courseId}).lean()
    ]);
    let reviewCourseOptions = formatReviewOptionsByLanguage(resources[0], langCode), reviewed = resources[1];
    let optionParents = [];
    let reviewedOptions = [];
    if(!reviewed) {
      reviewed = await ReviewCourse.create({
        user: userId, course: courseId, star
      })
    }
    reviewed = JSON.parse(JSON.stringify(reviewed));
    reviewed.options.forEach(option => {
      Array.prototype.push.apply(reviewedOptions, option.children);
    });
    reviewed.course = await formatCourseToReview(reviewed.course);

    reviewCourseOptions = reviewCourseOptions.map(opt => {
      if (opt.parent) {
        opt.selected = reviewedOptions.indexOf(opt._id) >= 0;
      }
      return opt;
    });

    if (star <= 3) {
      optionParents = [
        configs.reviewCourseOptionMapper['improve_course'],
        configs.reviewCourseOptionMapper['improve_lectures'],
        configs.reviewCourseOptionMapper['love_course'],
        configs.reviewCourseOptionMapper['love_lectures']
      ];
    } else {
      optionParents = [
        configs.reviewCourseOptionMapper['love_course'],
        configs.reviewCourseOptionMapper['love_lectures'],
        configs.reviewCourseOptionMapper['improve_course'],
        configs.reviewCourseOptionMapper['improve_lectures']
      ];
    }
    // console.log('star:', star);
    // console.log('optionParents:', optionParents);

    let index;
    let data = optionParents.map(optionParentId => {
      index = ArrayHelper.findItemByProp(reviewCourseOptions, '_id', optionParentId);
      let option = reviewCourseOptions[index];

      option.children = reviewCourseOptions.filter(opt => {
        return opt.parent && opt.parent.toString() === optionParentId;
      });

      index = ArrayHelper.findItemByProp(reviewed.options, 'parent', optionParentId);
      if(index !== false) {
        // console.log('reviewed.options:', reviewed.options);
        reviewed.options[index].children.forEach(review => {
          if(!StringHelper.isObjectId(review)) {
            option.children.push({
              _id: 'un',
              title: review,
              parent: optionParentId,
              selected: true
            });
          }
        });

      }
      return option;
    });
    reviewed = reviewed || {};
    reviewed.options = data;
    reviewed.summary = await getReviewStarSummary(courseId);
    return reviewed;
  } catch (err) {
    console.log('err on getReviewCourseOptions:', err);
    return Promise.reject({status: err.status || 500, error: err.error || 'Internal error.'});
  }
}

export async function getReviewStarSummary(courseId) {
  try {
    let reviews = await ReviewCourse.find({course: courseId}).lean();
    let one_star = 0, two_stars = 0, three_stars = 0, four_starts = 0, five_stars = 0, total_stars = 0;
    let  total_reviews = reviews.length;

    if(total_reviews) {
      reviews.forEach(review => {
        total_stars += review.star;
        switch (review.star) {
          case 5:
            five_stars++;
            break;
          case 4:
            four_starts++;
            break;
          case 3:
            three_stars++;
            break;
          case 2:
            two_stars++;
            break;
          default:
            one_star++;
            break;
        }
      });

      return {
        avg: (total_stars / total_reviews).toFixed(2),
        five_stars: (five_stars / total_reviews).toFixed(2),
        four_starts: (four_starts / total_reviews).toFixed(2),
        three_stars: (three_stars / total_reviews).toFixed(2),
        two_stars: (two_stars / total_reviews).toFixed(2),
        one_star: (one_star / total_reviews).toFixed(2)
      };
    }

    return {
      avg: 0,
      five_stars: 0,
      four_starts: 0,
      three_stars: 0,
      two_stars: 0,
      one_star: 0
    }
  } catch (err) {
    console.log('err on getReviewStarSummary:', err);
    return Promise.reject({status: err.status || 500, error: err.error || 'Internal error.'});
  }
}

export async function getRatingMyCourse(options) {
  try{
    let course = await Courses.findById(options.id).lean();
    if (course.creator.toString()!== options.user.toString()){
      return Promise.reject({status: 400, error: 'You not permission.'});
    }
    return await getReviewStarSummary(options.id);
  }catch (err){
    console.log('err on getRatingMyCourse:', err);
    return Promise.reject({status: err.status || 500, error: err.error || 'Internal error.'});
  }
}
