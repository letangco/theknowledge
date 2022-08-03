import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import StringHelper from '../../util/StringHelper';
import ArrayHelper from '../../util/ArrayHelper';
import User from '../../models/user';
import Message from '../../models/message';
import ChatGroup from '../../models/chatGroup';
import QuestionAnswer from '../../models/questionAnswers';
import Training from '../../models/training';
import configs from '../../config';
import Elasticsearch from '../Elasticsearch';
import bodybuilder from 'bodybuilder';
import {syncChatGroupAndMessage} from '../../controllers/chatGroup.controller';
import {findSkillsInQueryString} from '../../controllers/expert.controller';
import {searchExpertsWithSkills} from '../../controllers/expert.controller';
import {applySort as sortExperts} from '../../controllers/expert.controller';
import cuid from 'cuid';
import {serverSocketStaticInstance} from '../../routes/socket_routes/chat_socket';
import Simsimi from '../Simsimi';
import mem_cache from 'memory-cache';

const NOT_ALLOW_TRAIN = ['your name', 'who are you', 'who r you', 'who r u', 'tesse'];

const FIND_EXPERTS_FIRST_REPLIES = [
  "Ok! I will find for you some experts. What problem do you want to solve?",
  "Yes. Give me more detail about the experts you want!",
  "Sure. What do you want to search for?",
  "Of course. Type the request like this example: 'I need help from facebook marketing experts for my company' and I will find for you!"
];

// Q.process(globalConstants.jobName.NEW_MESSAGE, 1, async (job, done) => {
//   try {
//     let message = job.data;
//     let chatGroup = await ChatGroup.findOne({cuid: message.chatGroup});
//
//     let content = message.content.toLowerCase();
//     console.log('content:', content);
//     if (content === ':begin_train:') {
//       await Promise.all([
//         setChatGroupContext(message.chatGroup, 'training'),
//         reply(message, "Training question?")
//       ]);
//     } else if (chatGroup.context === 'training') {
//       await handleTraining(message);
//     } else if (content.toLowerCase() === 'find for me an expert') {
//       let rand = Math.floor((Math.random() * 4));
//       await Promise.all([
//         setChatGroupContext(message.chatGroup, 'findingExperts'),
//         reply(message, FIND_EXPERTS_FIRST_REPLIES[rand])
//       ]);
//     } else if (chatGroup.context === 'findingExperts') {
//       await handleFindExpert(message);
//     } else if(content.indexOf('your name') >= 0) {
//       await reply(message, "I'm Tess from Tesse Inc.");
//     } else if(content.indexOf('who are you') >= 0) {
//       await reply(message, "I'm Tess from Tesse Inc.");
//     } else if (StringHelper.isAQuestion(content)) {
//       await handleQuestion(message);
//     } else {
//       await handleNonQuestion(message);
//     }
//     //
//     // await syncChatGroupAndMessage(messageReply);
//     //
//     // // console.log('user receive:', message.userSend);
//     // serverSocketStaticInstance.emitToUser(message.userSend, 'UpdateMessageList', messageReply);
//     return done(null);
//   } catch (err) {
//     console.log('err on job NEW_MESSAGE:', err);
//     return done(err);
//   }
// });

async function handleQuestion(message) {
  try {
    let questionId = await searchQuestion(message.content);
    if (!questionId) {
      return handleNonQuestion(message);
    }

    console.log('questionId:', questionId);

    let answer = await findAnswer(questionId);
    if (!answer) {
      return handleNonQuestion(message);
    }

    return reply(message, answer.answer);
  } catch (err) {
    throw err;
  }
}

async function handleNonQuestion(message) {
  try {
    // let content = await Simsimi.chat(message.content);
    let content = "Sorry, i don't know.";
    // console.log('content:', content);
    return reply(message, content);
  } catch (err) {
    throw err;
  }
}

export async function reply(message, content, options) {
  let messageReply = await Message.create({
    cuid: cuid(),
    chatGroup: message.chatGroup,
    userSend: configs.tess.cuid,
    type: options && options.type ? options.type : 'msg',
    content: content,
    buttons: options && options.buttons ? options.buttons : undefined
  });
  await syncChatGroupAndMessage(messageReply);

  // messageReply = JSON.parse(JSON.stringify(messageReply));
  // messageReply.buttons = buttons;
  // console.log('user receive:', message.userSend);
  serverSocketStaticInstance.emitToUser(message.userSend, 'UpdateMessageList', messageReply);
}

async function searchQuestion(text) {
  try {
    text = text.toLocaleLowerCase().replace(/[^a-zA-Z0-9\s]+/g, '');
    let body = bodybuilder().size(100).query('match', 'search_text', text).build();
    body.min_score = 1.3;
    console.log('question query:', JSON.stringify(body));
    let rs = await Elasticsearch.search('questions', body, 'train');
    console.log('rs:', rs);
    if (!rs?.hits?.hits?.length) {
      return null;
    }

    let exactQuestions = rs?.hits?.hits?.filter(question => {
      return question._source.search_text.toLowerCase().replace(/[^a-zA-Z0-9\s]+/g, '') === text;
    });
    let questionPool = exactQuestions.length ? exactQuestions : rs?.hits?.hits;

    let arr = [
      [], // admin trainer
      [], //expert trainer
      []  // user trainer
    ];
    questionPool.forEach(question => {
      switch (question._source.trainerRole) {
        case 'admin':
          arr[0].push(question);
        break;
        case 'expert':
          arr[1].push(question);
          break;
        case 'user':
          arr[2].push(question);
          break;
      }
    });

    let filterValue = randomFilter();
    console.log('filterValue:', filterValue);
    switch (filterValue) {
      case 'admin':
        if(arr[0].length) {
          return ArrayHelper.getRandomItem(arr[0])['_id'];
        } else if(arr[1].length) {
          return ArrayHelper.getRandomItem(arr[1])['_id'];
        } else if(arr[2].length) {
          return ArrayHelper.getRandomItem(arr[2])['_id'];
        } else {
          return null;
        }
      case 'expert':
        if(arr[1].length) {
          return ArrayHelper.getRandomItem(arr[1])['_id'];
        } else if(arr[0].length) {
          return ArrayHelper.getRandomItem(arr[0])['_id'];
        } else if(arr[2].length) {
          return ArrayHelper.getRandomItem(arr[2])['_id'];
        } else {
          return null;
        }
      case 'user':
        if(arr[1].length) {
          return ArrayHelper.getRandomItem(arr[2])['_id'];
        } else if(arr[0].length) {
          return ArrayHelper.getRandomItem(arr[0])['_id'];
        } else if(arr[2].length) {
          return ArrayHelper.getRandomItem(arr[1])['_id'];
        } else {
          return null;
        }
    }
    // return rs?.hits?.hits?.shift()._id;
  } catch (err) {
    throw err;
  }
}

const FILTER_RAND_POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
function randomFilter() {
  let randItem = ArrayHelper.getRandomItem(FILTER_RAND_POOL);
  if(randItem < 7) {
    return 'admin'; // filter question by admin
  }
  if(randItem < 10) {
    return 'expert'; // filter question by expert
  }
  return 'user';   // filter question by user
}

async function findAnswer(questionId) {
  try {
    let answers = await Training.find({_id: questionId});
    if (!answers.length) {
      return null;
    }
    return answers.shift();
  } catch (err) {
    throw err;
  }
}


// Q.process(globalConstants.jobName.ASK_BOT_FOR_ANSWER, 1, async (job, done) => {
//   try {
//     let questionId = await searchQuestion(job.data.title);
//     if (!questionId) {
//       return done(null);
//     }
//
//     let answer = await findAnswer(questionId);
//     if (!answer) {
//       return done(null);
//     }
//     console.log('answer:', answer);
//     let created = await QuestionAnswer.create({
//       user: configs.tess._id,
//       question: job.data._id,
//       content: answer.answer
//     });
//     let feedOptions = {
//       question: job.data._id,
//       actor: created.user,
//       action: 'answer',
//       type: 'question',
//       comment: created
//     };
//     QuestionAnswer.createFeeds(QuestionAnswer, feedOptions);
//     return done(null);
//   } catch (err) {
//     console.log('err on job ASK_BOT_FOR_ANSWER:', err);
//     return done(err);
//   }
// });

async function setUpTrainingContext(chatGroup) {
  return ChatGroup.update({cuid: chatGroup}, {$set: {context: 'training'}});
}

async function handleTraining(message) {
  let replyContent = '';

  if(message.content === ':end_train:') {
    replyContent = 'Thanks for your training.';
    await ChatGroup.update({cuid: message.chatGroup}, {$set: {context: 'normal'}});
  } else {
    let user = await User.findOne({cuid: message.userSend});
    if (isValidTraningQuestion(message.content) || user.role === globalConstants.role.ADMIN) {
      let userSend = await User.findOne({cuid: message.userSend});
      let training = await Training.findOne({user: userSend._id, answer: null});

      if (!training) {
        await Training.create({
          user: userSend._id,
          question: message.content,
          trainerRole: userSend.role === globalConstants.role.ADMIN ? userSend.role : userSend.expert === 1 ? 'expert' : 'user'
        });
        replyContent = 'Traning answer?';
      } else {
        training.answer = message.content;
        await training.save();
        replyContent = "What's next?";
      }
    } else {
      replyContent = 'You can not train this question';
    }
  }
  return reply(message, replyContent);
}

function isValidTraningQuestion (question) {
  let i = 0, n = NOT_ALLOW_TRAIN.length;
  for(; i<n; i++) {
    if(question.indexOf(NOT_ALLOW_TRAIN[i]) >= 0)
      break;
  }
  return i === n;
}

function setChatGroupContext(chatGroupCuid, context) {
  return ChatGroup.update({cuid: chatGroupCuid}, {$set: {context: context}});
}

async function handleFindExpert (message) {
  let content = 'Sorry, i can not find any expert for your requirement.';
  let experts = mem_cache.get('bot_search_'+message.chatGroup);
  // console.log('cached:', experts);

  if(message.content.toLowerCase() === 'yes') {
    console.log('tim tiep');
    if(!experts) {
      console.log('khong co cache');
      return Promise.all([
        reply(message, content),
        setChatGroupContext(message.chatGroup, 'normal')
      ]);
    }
    console.log('cache co:', experts.length);
    let top3 = experts.splice(0, 3);
    let results = top3.map(expert => {
      return {
        fullName: expert.fullName,
        avatar: expert.avatar,
        departments: expert.departments,
        url: expert.userName ? `https://tesse.io/${expert.userName}` : `https://tesse.io/profile/${expert.cuid}`
      };
    });
    // let urls = top3.map((expert, i) => {
    //   return expert.userName ? `${i+1}. https://tesse.io/${expert.userName}` : `${i+1}. https://tesse.io/profile/${expert.cuid}`;
    // });
    content = `I found ${results.length} more experts here:`;
    if(experts.length) {
      mem_cache.put('bot_search_'+message.chatGroup, experts);
    } else {
      mem_cache.del('bot_search_' + message.chatGroup);
    }
    await reply(message, content);
    await reply(message, results, {type: 'experts'});
    return reply(message, "Need more? Type 'Yes' to get more experts", {buttons: ["Yes", "No, thanks!"]});
  }

  if(experts) {
    console.log('ket thuc');
    mem_cache.del('bot_search_' + message.chatGroup);
    content = "Thank you! You can type 'Find for me an expert' anytime and I will help you find them immediately";
    return Promise.all([
      reply(message, content),
      setChatGroupContext(message.chatGroup, 'normal')
    ]);
  }

  console.log('tim moi');
  let foundSkills = await findSkillsInQueryString(message.content, null, message.langCode);
  let skill_ids = foundSkills.map(foundSkill => {
    return foundSkill.id;
  });
  let expertObjects = await searchExpertsWithSkills(foundSkills, null, message.langCode);
  if(expertObjects instanceof Array && expertObjects.length) {
    expertObjects = JSON.parse(JSON.stringify(expertObjects));
    expertObjects = sortExperts({query: {sort: 1, order: 'desc'}}, expertObjects, skill_ids);

    console.log('tong cong co:', expertObjects.length);
    let top3 = expertObjects.splice(0, 3);
    let results = top3.map(expert => {
      return {
        fullName: expert.fullName,
        avatar: expert.avatar,
        departments: expert.departments,
        url: expert.userName ? `https://tesse.io/${expert.userName}` : `https://tesse.io/profile/${expert.cuid}`
      };
    });
    // let urls = top3.map((expert, i) => {
    //   return expert.userName ? `${i+1}. https://tesse.io/${expert.userName}` : `${i+1}. https://tesse.io/profile/${expert.cuid}`;
    // });
    let expertString = results.length > 1 ? 'experts' : 'expert';
    content = `I found for you ${results.length} ${expertString} who can help you:`;
    await reply(message, content);
    await reply(message, results, {type: 'experts'});

    experts = ArrayHelper.cloneArray(expertObjects);
  }
  if(expertObjects.length) {
    console.log('cache nha, key: bot_search_'+message.chatGroup);
    mem_cache.put('bot_search_'+message.chatGroup, experts);

    return reply(message, "Need more? Type 'Yes' to get more experts", {buttons: ["Yes", "No, thanks!"]});
  }
  return Promise.all([
    reply(message, content),
    setChatGroupContext(message.chatGroup, 'normal')
  ]);
}
