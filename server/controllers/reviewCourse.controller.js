import * as ReviewCourseServices from '../services/reviewCourse.services';
import StringHelper from '../util/StringHelper';
import ReviewCourse from '../models/reviewCourse';
export async function addReviewCourse(req, res) {
  try {
    let course = req.params.id || '';
    if(!course || !StringHelper.isObjectId(course)){
      throw {
        status: 400,
        success: false,
        error: "Invalid Params."
      }
    }
    let options = {
      user: req.user._id,
      course,
      star: req.body.star,
      content: req.body.content,
      options: req.body.options,
      streamId: req.body.streamId || null
    };
    let review = await ReviewCourseServices.addReviewCourse(options);

    return res.status(200).json({success: true, data: review});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function addCommentReview(req, res) {
  try {
    let review = req.params.id || '';
    if(!review || !StringHelper.isObjectId(review)){
      throw {
        status: 400,
        success: false,
        error: "Invalid Params."
      }
    }
    let options = {
      user: req.user._id,
      review,
      content: req.body.content,
    };
    return res.status(200).json({
      success: true,
      data: await ReviewCourseServices.addCommentReviewCourse(options)
    });
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function deleteCommentReview(req, res) {
  try {
    let review = req.params.id || '';
    if(!review || !StringHelper.isObjectId(review)){
      throw {
        status: 400,
        success: false,
        error: "Invalid Params."
      }
    }

    if(!req.user || req.user.role !== 'admin'){
      return res.status(404).json({success: false, error: 'Permission denied.'});
    }
    return res.status(200).json({
      success: true,
      data: await ReviewCourseServices.deleteCommentReviewCourse(review)});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function getCommentReviewCourse(req, res) {
  try {
    let review = req.params.id || '';
    if(!review || !StringHelper.isObjectId(review)){
      throw {
        status: 400,
        success: false,
        error: "Invalid Params."
      }
    }
    return res.status(200).json({
      success: true,
      data: await ReviewCourseServices.getCommentReviewCourse(review)});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function deleteReview(req, res) {

  let review = req.params.id || '';
  if(!review || !StringHelper.isObjectId(review)){

    return res.status(404).json({success: false, error: 'Review not found.'});
  }
  if(!req.user || req.user.role !== 'admin'){
    return res.status(404).json({success: false, error: 'Permission denied.'});
  }
  try {
    await ReviewCourse.remove({_id: review})
    return res.status(200).json({success: true})
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function getReviewsByCourse(req, res) {
  try {
    let courseId = req.params.id;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    let page = Number(req.query.page || 1).valueOf();

    let results = await ReviewCourseServices.getCourseReviews(courseId, page, req.headers.lang);
    results.success = true;
    results.current_page = page;
    results.last_page = Math.ceil(results.total_items / ReviewCourseServices.REVIEW_LIMIT);

    return res.status(200).json(results);
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getReviewCourseOptions(req, res) {
  try {
    let options = {
      courseId: req.params.id,
      userId: req.user._id,
      star: Number(req.query.star).valueOf(),
      langCode: req.headers.lang
    };

    let data = await ReviewCourseServices.getReviewCourseOptions(options);

    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getMyReviewedOptions(req, res) {
  try {
    let data = await ReviewCourseServices.getMyReviewedOptions(req.user._id, req.params.id, req.headers.lang);

    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getRatingMyCourse(req,res) {
  try{
    let options = {
      id:req.params.id,
      user:req.user._id
    };
    let data = await ReviewCourseServices.getRatingMyCourse(options);
    return res.json({
      success:true,
      data:data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}
