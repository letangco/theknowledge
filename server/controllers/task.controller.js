import User from '../models/user';
import Task from '../models/task';
import config from '../config';
import { countTaskByMonth, plusTaskToUser } from "../services/tasks.service";

import ArrayHelper from '../util/ArrayHelper';
const BOUNTIES_LIMIT = 20;
export async function getTasks(req, res) {
  try{
    let promises = [];
    promises.push(Task.find({ userId: req.user._id, type: 'REGISTER' }).sort({_id: -1}).lean());
    promises.push(Task.count({ userId: req.user._id, type: 'REGISTER'}));
    promises.push(Task.count({ userId: req.user._id, type: 'REGISTER', status: 0 }));
    promises.push(Task.count({ userId: req.user._id, type: 'REGISTER', status: 1 }));
    let results = await Promise.all(promises);
    if(!results.length) {
      return res.status(500).json({
        success: false, error: 'Internal error.'
      });
    }
    let tasks = results[0];
    let userSendIds = tasks.map(task => task.userSend);
    let users = await User.find({_id: {$in: userSendIds}}, 'email fullName').lean();
    let userMapper = ArrayHelper.toObjectByKey(users, '_id');
    tasks = tasks.map( task => {
      task.userSend = userMapper[task.userSend] ? userMapper[task.userSend] : task.userSend;
      return task;
    });
    return res.json({
      success: true,
      tasks: tasks,
      total: results[1],
      pending: results[2],
      active: results[3],
    })
  } catch (err){
    console.log('err on get tasks:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
export async function getUsersByEmail(data){
  try {
    let users = await User.find({$regex: '.*' + data.email + '.*'}, '_id').lean();
    if(users){
      users = users.map(user => {
        return user._id
      })
    }
    return users;
  } catch (err) {
    console.log('err on adminGetUsers:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function adminGetTasks(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let skip = (page - 1) * BOUNTIES_LIMIT;
    let type = req.query.type || '', status = req.query.status || '', users = [];
    let conditions = {};
    conditions.status = status || {$ne: null};
    if(type){
      conditions.type = req.query.type;
    }
    let results = await Promise.all([
      Task.count(conditions),
      Task.find(conditions).sort({_id: -1}).skip(skip).limit(BOUNTIES_LIMIT).lean()
    ]);
    let total_items = results[0], data = results[1], last_page = Math.ceil(total_items / BOUNTIES_LIMIT);
    let promises = data.map(async task => {
      let userInfo = await User.findById(task.userId).lean();
      if(userInfo){
        task.userInfo = {
          id: userInfo._id,
          email: userInfo.email
        }
      }
      return task;
    })
    data = await Promise.all(promises);
    return res.status(200).json({
      success: true,
      current_page: page,
      last_page,
      total_items,
      data
    });
  } catch (err) {
    console.log('err on adminGetUsers:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function getTasksByType(req, res) {
  try{
    let tasks = await Task.find({ userId: req.user._id, type: req.params.type}).sort({_id: -1}).lean();
    let total = 0;
    if(tasks){
      tasks.map(task => {
        if(task.status === 1){
          total += task.amount;
        }
      })
    }
    let count = await countTaskByMonth({type: req.params.type, userId: req.user._id});
    return res.json({
      success: true,
      tasks: tasks,
      total: total,
      next: count < 4
    })
  } catch (err){
    console.log('err on get tasks:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function getActive(req, res) {
  try{
    var date = new Date();
    var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    let promises = [
      Task.aggregate([
        {$match: {
            $and: [
              {'dateAdded': {$gte: firstDay}},
              {'dateAdded': {$lte: lastDay}},
              {'status': 1},
              {'userId': req.user._id},
            ]
        }},
        {
          $group: {
            _id: null,
            sum_amount: {$sum: "$amount"}
          }
        }
      ]),
      Task.aggregate([
        {$match: {
            $and: [
              {'status': 1},
              {'userId': req.user._id},
            ]
          }},
        {
          $group: {
            _id: null,
            sum_amount: {$sum: "$amount"}
          }
        }
      ])
    ];
    let results = await Promise.all(promises);
    if(!results){
      return res.status(404).json({success: false, error: 'User not found.'});
    }
    return res.json({
      success: true,
      data: {
        month: results[0].length ? results[0][0].sum_amount : 0,
        all: results[1].length ? results[1][0].sum_amount : 0,
      }
    })
  } catch (err){
    console.log('err on get getActiveMonth:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
export async function getTaskByType(req, res) {
  try{
    let task = await Task.findOne({ userId: req.user._id, type: req.params.type}).lean();
    return res.json({
      success: true,
      task: task
    })
  } catch (err){
    console.log('err on get task:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function getTasksByTypes(req, res) {
  try{
    let tasks = await Task.find({ userId: req.user._id, type: {$in: req.body}}).sort({_id: -1}).lean();
    let tasksMapper = ArrayHelper.toObjectByKey(tasks, 'type');
    return res.json({
      success: true,
      tasks: tasksMapper
    })
  } catch (err){
    console.log('err on get tasks:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function updateTaskSocialMedia(req, res) {
  try{
    if(req.body){
      for (var social in req.body) {
        let conditions = {
          userId: req.user._id,
          type: social,
        };
        let task = Object.assign({}, conditions);
        task.amount = config.task[social];
        task.status = 0;
        task.content = {
          data: req.body[social]
        };
        await Task.update(conditions, task, {upsert: true});
      }
    }
    return res.json({
      success: true
    })
  } catch (err){
    console.log('err on get tasks:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function adminUpdateTask(req, res) {
  try{
    let task = await Task.findById(req.params.id);
    if(!task) {
      return res.status(404).json({success: false, error: 'Task not found.'});
    }

    task.status = req.body.status;
    await task.save();
    if(req.body.status === 1){
      plusTaskToUser(task._id)
    }
    return res.status(200).json({success: true});
  } catch (err){
    console.log('err on update task:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}


export async function userDeleteTask(req, res) {
  try{
    await Task.remove({_id: req.params.id, userId: req.user._id});
    return res.status(200).json({success: true});
  } catch (err){
    console.log('err on userDeleteTask task:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function getTotalTaskToken(req, res) {
  try {
    let user = await User.findById(req.user._id);
    if(user){
      let totalBalance = await Task.aggregate(
        {
          $match: {
            status: 1,
            userId: user._id
          }
        },
        {
          $group: {
            _id: "$userId",
            sum_rate: {$sum: "$amount"}
          }
        }
      ).exec();
      if(totalBalance.length){
        let total = totalBalance[0]
        return res.status(200).json({
          success: true,
          data: total.sum_rate
        });
      } else {
        return res.status(200).json({
          success: true,
          data: parseFloat(0).toFixed(2)
        });
      }
    } else {
      return res.status(404).json({success: false, error: 'User not found.'});
    }
  } catch (err) {
    console.log('err on getUsersByRefCode:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}
export async function addTaskProgram(req, res) {
  try{
    let count = await countTaskByMonth({type: req.body.type, userId: req.user._id});
    if(count >= 4){
      return res.json({
        success: false,
        error: 'LIMITED'
      })
    }
    if(req.body) {
      let taskInfo = await Task.findOne({ 'content.data': req.body.url}).lean()
      if(taskInfo)
        return res.json({
          success: false,
          error: 'URL_EXIST'
        })
      const newTask = new Task();
      newTask.userId = req.user._id;
      newTask.amount = config.task.social[req.body.type].value;
      newTask.type = req.body.type;
      newTask.content = {
        data: req.body.url
      };
      newTask.save();
      return res.json({
        success: true
      })
    }
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  } catch (err){
    console.log('err on get tasks:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}