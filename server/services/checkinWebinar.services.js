import CheckinWebinar from '../models/checkinWebinar';

export async function createCheckin(checkinOption) {
  try {
    return await CheckinWebinar.create(checkinOption);
  } catch (err) {
    console.log('err on createCheckin:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
