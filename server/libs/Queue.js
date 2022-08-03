import kue from 'kue';
import basicAuth from 'basic-auth-connect';
import configs from '../config';

const queue = kue.createQueue(configs.kue);
let app = kue.app;
app.set('title', 'Kue Service');
app.use(basicAuth(configs.kueUI.username, configs.kueUI.password));

queue.kue = kue;
export function removeJob(id,nameJob) {
  kue.Job.get(id,nameJob,function (err,job) {
    if(err) {
      return false;
    }
    job.remove(function (err) {
      if(err) throw err;
      console.log('Remove Job Success!',job.id);
    })
  })
}
queue.on('job complete',function (id, result) {
});
exports.Q = queue;
exports.queueUI = app;
