import cron from 'cron';
import withdrawalJob from './CronJobs/Withdrawal';
import dailyTrackingJob from './CronJobs/DailyTracking';
import SitemapTracking from './CronJobs/SitemapTracking';
import BackupDatabase from './CronJobs/backupDatabase';
import sendEmailtoTutorNonProfile from './CronJobs/emailToNoTutorProfile';
import UnActiveProfileTutorNonProfile from './CronJobs/deactiveTutorNonProfile';

let fileName = null;

export default class CronJobs {
    constructor() {
      new cron.CronJob(BackupDatabase);
      new cron.CronJob(withdrawalJob);
      new cron.CronJob(dailyTrackingJob);
      new cron.CronJob(SitemapTracking);
      //new cron.CronJob(CheckStatusLivestream);

      // check tutor non profile tutor
      new cron.CronJob(sendEmailtoTutorNonProfile);
      new cron.CronJob(UnActiveProfileTutorNonProfile);
    }
}
