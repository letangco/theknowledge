import User from '../../models/user';
import configs from '../../config';
import Courses from "../../models/courses";
import Knowledge from "../../models/knowledge";
import Question from "../../models/questions";
import RemoveFeed from '../../scripts/tesse_scripts/remove_feed_live';
import RemoveFeedSchedule from '../../scripts/tesse_scripts/clear_feed_webinar';
// import {notifyRenewMembership} from "./RenewMemberShip";

var sm = require('sitemap')
  , fs = require('fs');
export  async function generalSiteMap() {
  let urls = [
    { url: configs.domainRoot,  changefreq: 'daily', priority: 1 },
    { url: '/live',  changefreq: 'daily',  priority: 0.8 },
    { url: '/event',  changefreq: 'daily',  priority: 0.8 },
    { url: '/course',  changefreq: 'daily',  priority: 0.8 },
    { url: '/about-us',  changefreq: 'monthly', priority: 0.3 },
    { url: '/legal',  changefreq: 'monthly', priority: 0.3 },
    { url: '/expert',  changefreq: 'monthly', priority: 0.3 },
    { url: '/become-an-expert',  changefreq: 'monthly', priority: 0.3 },
    { url: '/pre-feed',  changefreq: 'monthly', priority: 0.3 },
    { url: '/login',  changefreq: 'monthly', priority: 0.3 },
    { url: '/sign-up',  changefreq: 'monthly', priority: 0.3 },
  ];
  //Get courses list
  let coursesList = await Courses.find({status: {$in : [1, 2, 3, 4, 9]}}, 'slug').lean();
  if(coursesList){
    coursesList.map(course => {
      urls.push({ url: `/course/${course.slug}`,  changefreq: 'weekly',  priority: 1.0 })
    })
  }
  //Get knowledge list
  let knowledgeList = await Knowledge.find({state: "published"}, 'slug').lean();
  if(knowledgeList){
    knowledgeList.map(knowledge => {
      urls.push({ url: `/post/${knowledge.slug}`,  changefreq: 'weekly',  priority: 1.0 })
    })
  }
  //Get question list
  let questionList = await Question.find({state: "published"}, 'slug').lean();
  if(questionList){
    questionList.map(question => {
      urls.push({ url: `/ask/${question.slug}`,  changefreq: 'weekly',  priority: 1.0 })
    })
  }
  //Get user list
  let userList = await User.find({active: 1}, 'cuid userName').lean();
  if(userList){
    userList.map(user => {
      if(user.userName){
        urls.push({ url: `/${user.userName}`,  changefreq: 'weekly',  priority: 1.0 })
      } else {
        urls.push({ url: `/profile/${user.cuid}`,  changefreq: 'weekly',  priority: 1.0 })
      }
    })
  }
  var sitemap = sm.createSitemap ({
    hostname: configs.domainRoot,
    cacheTime: 600000,  // 600 sec cache period
    urls: urls
  });
  fs.writeFileSync("../TesseFrontEnd/sitemap.xml", sitemap.toString());
}


export default {
  cronTime: configs.siteMap,
  onTick: async () => {
    await Promise.all([
      RemoveFeed(),
      RemoveFeedSchedule(),
      generalSiteMap(),
      // notifyRenewMembership()
    ]);
  },
  start: true
};
