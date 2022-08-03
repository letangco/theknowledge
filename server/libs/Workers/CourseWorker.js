import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import LiveStream from '../../models/liveStream';
import User from '../../models/user';
import {joinCourse} from "../../services/course.services";
import rimraf from 'rimraf';
import * as Course_Service from '../../services/course.services';
import Elasticsearch from '../Elasticsearch';
import {deleteFile} from "../../gdrive/GDrive";

Q.process(globalConstants.jobName.CREATE_ELASTICSEARCH_COURSE, 1, async (job, done) =>{
  try {
    let data = job.data;
    data = await Course_Service.buildElasticDoc(data);
    Elasticsearch.index('courses',data);
    return done(null);
  }catch (err){
    console.log(" err CREATE_ELASTICSEARCH_COURSE : ",err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.DELETE_ELASTICSEARCH_COURSE, 1, async (job, done) =>{
  try {
    let data = job.data;
    Elasticsearch.delete('courses',data._id.toString());
    return done(null);
  }catch (err){
    console.log(" err DELETE_ELASTICSEARCH_COURSE : ",err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.AFTER_JOIN_COURSE, 1, async (job, done) => {
  try {
    let joinCourse = job.data;
    Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {action: 'join_course', detail: joinCourse}).removeOnComplete(true).save();
    await LiveStream.update(
    	{course:joinCourse.course},
	    {
         $push:{
           'privacy.invited':joinCourse.user.toString()
         }
      },
	    {multi:true}
    );
    return done(null);
  } catch (err) {
    console.log('err on job AFTER_JOIN_COURSE:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.AFTER_REMOVE_COURSE_CODE, 1, async (job, done) => {
  try {
    let course = job.data;
    await LiveStream.update(
    	{course:course.course},
	    {
         $pull:{
           'privacy.invited':course.user.toString()
         }
      },
	    {multi:true}
    );
    return done(null);
  } catch (err) {
    console.log('err on job AFTER_REMOVE_COURSE_CODE:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.JOIN_COURSE_AFTER_PAY, 1, async (job, done) => {
  try {
    let payment = job.data;
    let couponCode = payment.paymentInfo.data.couponCode || '';
    let user = await User.findById(payment.user_id).lean();
    if(!user){
      user = await User.findOne({cuid: payment.userId}, '_id').lean();
    }
    if(!user) {
      return Promise.reject({success: false, error: 'User not found.'});
    }
    await joinCourse(user._id,
      payment.paymentInfo.data.courseID,
      payment.paymentType === 'vtcPay' ? 'vi' : 'en',
      payment.affCode,
      couponCode,
      payment.memberCode || '');

    return done(null);
  } catch (err) {
    console.log('err on job JOIN_COURSE_AFTER_PAY:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.DELETE_FILE, 1, async (job, done) => {
  try {
    let fileId = job.data.fileId;
    let path = job.data.filePath;
    if ( path ) {
      // Old data
      // console.log('path:', path);
      rimraf.sync(path);
    } else if ( fileId ) {
      // console.log('fileId:', fileId);
      await deleteFile(fileId);
    }
    return done(null);
  } catch (err) {
    console.error('err on job DELETE_FILE:', err.message);
    return done(err);
  }
});
