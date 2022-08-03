import InteractWebinar from '../models/interactWebinar';
import User from '../models/user';
import ArrayHelper from '../util/ArrayHelper';

const ALLOW_INTERACTS = ['going', 'interested', 'not'];
const INTERACTION_LIMIT = 10;

async function getMetadata(interactions) {
  try {
    if(!(interactions instanceof Array)) {
      interactions = [interactions];
    }
    interactions = JSON.parse(JSON.stringify(interactions));

    let userIds = interactions.map(interaction => interaction.user);
    let users = await User.formatBasicInfo(User, userIds);
    let userMapper = ArrayHelper.toObjectByKey(users, '_id');

    return interactions.map(interaction => {
      interaction.user = userMapper[interaction.user];
      return interaction;
    });
  } catch (err) {
    console.log('err on getMetadata:', err);
    return Promise.reject({status: err.status || 500, error: err.error || 'Internal error.'});
  }
}

export async function interactWebinar(userId, webinarId, interact) {
  try {
    if(ALLOW_INTERACTS.indexOf(interact) < 0) {
      return Promise.reject({status: 400, error: 'Invalid interaction.'});
    }

    let conditions = {
      user: userId,
      webinar: webinarId,
    };
    let interaction = await InteractWebinar.findOne(conditions);
    if(!interaction) {
      interaction = new InteractWebinar(conditions);
    }

    if(interact !== 'not') {
      interaction.interact = interact;
      return await interaction.save();
    }

    await interaction.remove();

    return undefined;
  } catch (err) {
    console.log('err on interactWebinar:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getWebinarInteractions(webinarId, interact, page) {
  try {
    let skip = (page - 1) * INTERACTION_LIMIT;
    let conditions = {
      webinar: webinarId,
      interact: interact || {$ne: null}
    };

    let results = await Promise.all([
      InteractWebinar.count(conditions),
      InteractWebinar.find(conditions).sort({created_at: -1}).skip(skip).limit(INTERACTION_LIMIT).lean()
    ]);
    let total_items = results[0], data = await getMetadata(results[1]);

    return {
      current_page: page,
      last_page: Math.ceil(total_items / INTERACTION_LIMIT),
      total_items,
      data
    };
  } catch (err) {
    console.log('err on getWebinarInteractions:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getWebinarInteractionsByUser(userId, webinarIds) {
  try {
    if(!(webinarIds instanceof Array)) {
      webinarIds = [webinarIds];
    }

    return await InteractWebinar.find({
      user: userId,
      webinar: webinarIds.length ? {$in: webinarIds} : {$ne: null}
    }).lean();
  } catch (err) {
    console.log('err on getWebinarInteractionsByUser:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
