import * as Membership_Services from '../services/memberShip.services';
import {reportMembership, reportMembershipByMonth} from "../scripts/exports_data/export_membership";
import path from 'path';
import cuid from 'cuid';
import Payment from '../models/payment.js';
import UserViewTracking from '../models/userViewTracking';
import StreamInviteTracking from '../models/streamInviteTracking';
import LiveStream from '../models/liveStream';
import User from '../models/user';
import serverConfig from "../config";
import {generateInviteCode} from "../models/functions";
import Setting from "../models/setting";


export async function report(req,res) {
  try{
    let data = req.query;
    let title = await reportMembership(data);
    let spath = path.join(__dirname,'..','..','exports',title);
    return res.download(spath);
  }catch (err){
    console.log(err);
    return res.status(err.status).json(err);
  }
}

export async function reportMemnershipByMonth(req,res) {
  try{
    if(req.query.from){
      let users = await Membership_Services.reportMembershipByMonth(req.query.from)
      let title = await reportMembershipByMonth(users)
      let spath = path.join(__dirname,'..','..','exports',title);
      return res.download(spath);
    } else {
      return res.json({
        status:400,
        success:false,
        error:'Invalid params!'
      })
    }
  }catch (err){
    console.log(err);
    return res.status(err.status).json(err);
  }
}

export async function activeMemberShip(req,res) {
  try{
    let paymentId = req.params.payment;
    if (!paymentId){
      return res.json({
        status:400,
        success:false,
        error:'Invalid params!'
      })
    }
    let data = await Membership_Services.activeMembership({paymentId});
    return res.json({
      success:true,
      data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}
export async function updateStatus(req,res) {
  try{
    let paymentId = req.params.payment;
    if (!paymentId){
      return res.json({
        status:400,
        success:false,
        error:'Invalid params!'
      })
    }
    let status = req.query.status;
    if(!status){
      return res.json({
        status:400,
        success:false,
        error:'Invalid status!'
      })
    }
    let data = await Membership_Services.updateStatus({paymentId, status});
    return res.json({
      success:true,
      data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}
export async function generalCode(req,res) {
  try{
    let paymentId = req.params.payment;
    if (!paymentId){
      return res.json({
        status:400,
        success:false,
        error:'Invalid params!'
      })
    }
    let data = await Membership_Services.generalCode({paymentId});
    return res.json({
      success:true,
      data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}
export async function createCodeMemberShip(req,res) {
  try{
    const newPayment = new Payment({
        cuid: cuid(),
        affCode: '',
        userId:'',
        paymentType : 'AdminCreated',
        type : 1,
        amount : 0,
        currency: {
          currency: 'VND',
          rate: serverConfig.moneyExchangeRate.vi
        },
        paymentInfo : req.body.paymentInfo ? req.body.paymentInfo : {},
        status : -3,
        memberCode: await generateInviteCode(10)
      }
    );
    newPayment.save((err, saved) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.json({
        success: true,
        payment: saved
      });
    });
  }catch (err){
    return res.status(err.status).json(err);
  }
}
export async function checkPromotion(req, res) {
  try {

    let inviteCode = req.params.inviteCode || null;
    let userId = req.user._id || null;
    if(!inviteCode){
      return res.status(404).json({success: false, error: 'INVITE_CODE_FOUND'});
    }
    let data = await Membership_Services.checkPromotion(inviteCode, userId);
    return res.json({
      success: true,
      data: data
    });
  } catch (err) {
    console.log('err getMemberShipSetting: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getPromotionSetting(req, res) {
  try {
    let info = await Setting.findOne({'type': 'promotion'}, 'data').lean();
    let promotion = info ? info.data : {};
    if (!promotion || promotion.status === 'disabled') {
      return res.status(404).json({success: false});
    }
    if (parseInt(promotion.expireDate) && new Date(promotion.expireDate).getTime() < new Date().getTime()) {
      return res.status(404).json({success: false});
    }
    return res.json({
      success: true,
      data: promotion
    })
  } catch (err) {
    console.log('err getPromotionConfig: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getStats(req, res) {
  try {
    let totalStreamingTime;
    try {
      const totalTimeStreamResult = await UserViewTracking.aggregate([
        {
          $group: {
            _id: null,
            totalTimeView: {$sum: '$totalTimeView'}
          }
        }
      ]);
      if ( totalTimeStreamResult && totalTimeStreamResult[0] ) {
        totalStreamingTime = totalTimeStreamResult[0].totalTimeView;
      }
    } catch ( error ) {
      console.error('getStats get totalTimeStream error');
      console.error(error);
    }
    let totalInvite;
    try {
      totalInvite = await StreamInviteTracking.count({});
    } catch ( error ) {
      console.error('getStats get totalInvite error');
      console.error(error);
    }
    let totalInviteConnectedTime;
    try {
      const totalInviteConnectedTimeResult = await StreamInviteTracking.aggregate([
        {
          $group: {
            _id: null,
            totalTime: {$sum: '$totalTime'}
          }
        }
      ]);
      if ( totalInviteConnectedTimeResult && totalInviteConnectedTimeResult[0] ) {
        totalInviteConnectedTime = totalInviteConnectedTimeResult[0].totalTime;
      }
    } catch ( error ) {
      console.error('getStats get totalInviteConnectedTime error');
      console.error(error);
    }
    let totalLesson;
    try {
      totalLesson = await LiveStream.count({course: {$ne: null}});
    } catch ( error ) {
      console.error('getStats get totalLesson error');
      console.error(error);
    }
    return res.json({
      success: true,
      data: {
        totalStreamingTime: totalStreamingTime,
        totalInvite: totalInvite,
        totalInviteConnectedTime: totalInviteConnectedTime,
        totalLesson: totalLesson,
      }
    })
  } catch (error) {
    console.error('getStats:');
    console.error(error);
    error.success = false;
    return res.status(error.status || 500).json(error);
  }
}

export async function getStatsAdmin(req, res) {
  try {
    let totalUserViewedStream;
    try {
      totalUserViewedStream = await UserViewTracking.count({});
    } catch ( error ) {
      console.error('getStatsAdmin get totalUserViewedStream error');
      console.error(error);
    }
    let totalUserMembership;
    try {
      totalUserMembership = await User.count({memberShip: {$ne: null}});
    } catch ( error ) {
      console.error('getStatsAdmin get totalUserMembership error');
      console.error(error);
    }
    return res.json({
      success: true,
      data: {
        totalUserViewedStream: totalUserViewedStream,
        totalUserMembership: totalUserMembership,
      }
    })
  } catch (error) {
    console.error('getStatsAdmin:');
    console.error(error);
    error.success = false;
    return res.status(error.status || 500).json(error);
  }
}

/**
 * Params req.body:
 * date - Date Schedule
 * hour - Hour Schedule
 * minute - Minute Schedule
 * utcOffset - Mui Gio
 * user - User ID
 * days - Time membership
 * */

export async function activeMemberShipSchedule(req,res) {
  try{
    let data = await Membership_Services.activeMemberShipSchedule(req.body);
    return res.json({
      success:true,
      data:data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function getListMembership(req,res) {
  try{
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 12).valueOf();
    let skip = (page - 1) * limit;
    let options = {
      limit,
      skip
    };
    let rs = await Membership_Services.getListMembership(options);
    return res.json({
      status:200,
      success:true,
      total:rs[0],
      total_page: Math.ceil(rs[0]/limit),
      current_page: page,
      data:rs[1],
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function registryTrial(req, res) {
  try{
    let userId = req.user._id || null;
    let user = await User.findById(userId).lean()
    if(!user){
      return res.json({
        status:400,
        success:false,
        error:'USER_NOT_FOUND'
      })
    }
    if(user.teacherMembership){
      return res.json({
        status:400,
        success:false,
        error:'USER_REGISTRY'
      })
    }

  } catch (err) {
    console.log('error registryTrial:', err);
    return res.status(err.status).json(err);
  }
}
