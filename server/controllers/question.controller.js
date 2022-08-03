import Question from '../models/questions';
import User from '../models/user';
import StringHelper from '../util/StringHelper';
import cuid from 'cuid';
import Knowledge from '../models/knowledge';
import {slugBuilder} from "../util/string.helper";

export async function addQuestion(req, res) {
  try {
    let question = {
      user: req.user._id,
      title: StringHelper.sanitizeHtml(req.body.title),
      tags: req.body.tags,
      state: req.body.state,
      anonymous: req.body.anonymous,
      department: req.body.department || 'ge'
    };

    let content = JSON.parse(req.body.content);
    if (!Object.keys(content.entityMap).length || !('entityMap' in content)) {
      console.log('ko co entityMap ne');
      content['entityMap'] = {
        0: {a: ''}
      };
    }
    question.content = content;
    question.slug = await buildSlug(question.title);
    question.thumbnail = Knowledge.getKnowledgeThumbnails(question);
    question.description = Knowledge.getKnowledgeDescription(Knowledge, question);
    question.language = StringHelper.detectLanguage(question.title);

    let created = await Question.create(question);
    let feedOptions = {
      question: created,
      actor: created.user,
      action: 'ask',
      type: 'question',
    };
    Question.createFeeds(feedOptions);

    created = await Question.getMetadata(created, null, req.headers.lang);



    return res.json({success: true, data: created});
  } catch (err) {
    console.log('err on addQuestion:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

async function buildSlug(title) {
  let simpleSlug = slugBuilder(title);
  let isExists = await Question.count({slug: simpleSlug});
  if(!isExists) {
    return simpleSlug;
  }
  return simpleSlug + '-' + cuid.slug();
}

export async function getQuestion(req, res) {
  try {
    let requester = null;
    if (req.headers && req.headers.token) {
      requester = await User.findOne({token: req.headers.token}, '_id');
    }

    if (!req.query.slug && !req.query.id) {
      return res.status(400).json({success: false, error: 'Invalid input'});
    }

    let conditions = req.query.slug ? {slug: req.query.slug} : {_id: req.query.id};
    let question = await Question.findOne(conditions);
    if(!question) {
      return res.status(404).json({success: false, error: 'Question not found.'});
    }

    question = await Question.getMetadata(question, requester ? requester._id : null, req.headers.lang);

    return res.json({success: true, data: question});
  } catch (err) {
    console.log('err on getQuestion:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function editQuestion(req, res) {
  try {
    if(!req.params.id || req.params.id == 'undefined') {
      return res.status(404).json({success: false, error: 'Question not found.'});
    }

    let question = await Question.findById(req.params.id);
    if(!question) {
      return res.status(404).json({success: false, error: 'Question not found.'});
    }

    if(question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({success: false, error: 'Permission denied.'});
    }

    let newTitle = StringHelper.sanitizeHtml(req.body.title);
    if(newTitle && newTitle !== question.title) {
      question.title = newTitle;
      question.slug = await buildSlug(newTitle);
    }

    if(req.body.content) {
      let content = JSON.parse(req.body.content);
      if(!Object.keys(content.entityMap).length || !('entityMap' in content)) {
        console.log('ko co entityMap ne');
        content['entityMap'] = {
          0: {a: ''}
        };
      }
      question.content = content;
      question.markModified('content');
    }
    if (req.body.tags) {
      question.tags = req.body.tags;
      question.markModified('tags');
    }

    question.department = req.body.department ? req.body.department : question.department;

    let changeAnonymous = false;
    // console.log('body:', req.body)
    if(question.anonymous && 'anonymous' in req.body && req.body.anonymous.toString() === 'false') {
      question.anonymous = false;
      changeAnonymous = true;
      console.log('change anonymous ne nha');
    }
    question.thumbnail = Knowledge.getKnowledgeThumbnails(question);
    question.description = Knowledge.getKnowledgeDescription(Knowledge, question);
    let edited = await question.save();
    if(changeAnonymous) {
      // console.log('edited:', edited);
      let feedOptions = {
        question: edited,
        actor: edited.user,
        action: 'ask',
        type: 'question',
      };
      Question.createFeeds(feedOptions);
    }



    let data = await Question.getMetadata(edited, null, req.headers.lang);

    return res.json({success: true, data: data});
  } catch (err) {
    console.log('err on editQuestion:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function deleteQuestion(req, res) {
  try {
    if(!req.params.id || req.params.id == 'undefined') {
      return res.status(404).json({success: false, error: 'Question not found.'});
    }

    let question = await Question.findById(req.params.id);
    if(!question) {
      return res.status(404).json({success: false, error: 'Question not found.'});
    }

    if(question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({success: false, error: 'Permission denied.'});
    }
    await Question.remove({_id:req.params.id});

    return res.json({success: true});
  } catch (err) {
    console.log('err on deleteQuestion:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function getQuestionMeta(req, res) {
  try {
    if(!req.params.slug || req.params.slug === 'undefined') {
      return res.json({});
    }

    let condition =  {slug: req.params.slug};
    let question = await Question.findOne(condition);

    if(!question) {
      return res.json({});
    }

    let tags = question.tags.map(tag => tag.text);
    return res.json({
      title : question.title,
      description : question.description === '...' ? '' : question.description,
      tags : tags,
      type : 'article',
      thumbnails : question.thumbnail,
    })
  } catch (err) {
    return res.json({});
  }
}
