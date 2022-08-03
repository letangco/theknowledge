import User from '../models/user';
import config from '../config';
import Task from '../models/task';
import Notification from "../models/notificationNew";
import AMPQ from "../../rabbitmq/ampq";
import globalConstants from "../../config/globalConstants";
import MemberShip from "../models/memberShip";
export async function addTaskReferral(user, taskCode) {
  try{
    let userInvite = await User.findOne({ inviteCode: taskCode }).lean();
    if(userInvite){
      let countTask = await countTaskByMonth({type: 'REGISTER', userId: userInvite._id});
      if(countTask < 10){
        let taskInfo = await addTaskHistory({
          userId: userInvite._id,
          userSend: user._id,
          type: user.active ? 'registerSocial' : 'registerForm'
        });
        if(taskInfo && taskInfo.status){
          plusTaskToUser(taskInfo._id);
        }
      }
    }
    let taskInfo = await addTaskRegistration({
      userId: user._id
    });
    if(taskInfo && user.active){
      plusTaskToUser(taskInfo._id);
    }
  } catch (err){
    console.log('err addTaskReferral : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
export async function addTaskLoginApp(userId) {
  try {
    let taskInfo = await Task.findOne({userId: userId, type: 'LOGINAPP'}).lean();
    if(taskInfo) return;
    const newTask = new Task();
    newTask.userId = userId;
    newTask.amount = config.task.LOGINAPP;
    newTask.type = 'LOGINAPP';
    newTask.status = 1;
    let data = await newTask.save();
    if(data){
      plusTaskToUser(data._id);
    }
  } catch (err){
    console.log('err addTaskLoginApp : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
export async function addTaskLogin(userId) {
  try {
    let taskInfo = await Task.findOne({userId: userId, type: 'REGISTRATION'}).lean();
    if(taskInfo) return;
    const newTask = new Task();
    newTask.userId = userId;
    newTask.amount = config.task.REGISTRATION;
    newTask.type = 'REGISTRATION';
    newTask.status = 1;
    let data = await newTask.save();
    if(data){
      plusTaskToUser(data._id);
    }
  } catch (err){
    console.log('err addTaskLogin : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
export async function plusTaskToUser(taskId) {
  try{
    let taskInfo = await Task.findById(taskId).lean();
    if(taskInfo){
      let user = await User.findById(taskInfo.userId).lean();
      if(user){
        let time = user.memberShip > Date.now() ? user.memberShip + taskInfo.amount*24*60*60*1000 :
          Date.now() + taskInfo.amount*24*60*60*1000;
        await User.update({ _id: user._id }, { $set: { memberShip: time } });
        await Notification.remove({
          to: user._id,
          type: "RemindRenewMemberShip"
        });
        let notifications = {
          to:user._id,
          type:'plusMemberShip',
          data:{
            time: time,
            dateActive: taskInfo.amount,
            userId: '',
            typePush: taskInfo.type,
            url:`tasks`
          }
        };
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notifications);
        let joinMemberShip = {
          user: user._id,
          type: taskInfo.type,
          memberShip: `TASK ${taskInfo.type}`,
          total: 0,
          time: time,
          currency: '',
          priceRate: '',
          contactInfo: {}
        };
        await MemberShip.create(joinMemberShip);
      }
    }
  } catch (err){
    console.log('err plusTaskToUser : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
export  async function countTaskByMonth(data) {
  try {
    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return await Task.count({
      $and: [
        {'dateAdded': {$gte: firstDay}},
        {'dateAdded': {$lte: lastDay}},
        {'type': data.type},
        {'userId': data.userId},
      ]}).lean();
  } catch (err){
    console.log('err countTaskByMonth : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
export async function updateTaskInviteRegister(userSend, type) {
  try {
    await Task.update({userSend: userSend, type: type},
      { $set: { status: 1 }});
  } catch (err){
      console.log('err updateTaskInviteRegister : ',err);
      return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
    }
  }
export async function addTaskHistory(data) {
  try {
    let taskInfo = await Task.findOne({ userId: data.userId, userSend: data.userSend }).lean();
    if(taskInfo) return;
    if(data.type === 'registerForm'){
      const newTask = new Task();
      newTask.userId = data.userId;
      newTask.userSend = data.userSend;
      newTask.amount = config.task['REGISTER'];
      newTask.type = 'REGISTER';
      return newTask.save();
    } else {
      const newTask = new Task();
      newTask.userId = data.userId;
      newTask.userSend = data.userSend;
      newTask.amount = config.task['REGISTER'];
      newTask.status = 1;
      newTask.type = 'REGISTER';
      return newTask.save();
    }
  } catch (err){
    console.log('err addTaskHistory : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
export async function addTaskRegistration(data) {
  try {
    const newTask = new Task();
    newTask.userId = data.userId;
    newTask.amount = config.task['REGISTRATION'];
    newTask.status = 1;
    newTask.type = 'REGISTRATION';
    return newTask.save();
  } catch (err){
    console.log('err addTaskRegistration : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
export function addTask(data) {
  try {
    const newTask = new Task();
    newTask.userId = data.userId;
    newTask.amount = config.task[data.type];
    newTask.status = data.status;
    newTask.type = data.type;
    newTask.save();
  } catch (err){
    console.log('err addTask : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
