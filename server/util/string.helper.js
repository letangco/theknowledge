import mongoose from 'mongoose';
import slug from 'limax';

export function getObjectId(objectId) {
  try {
    if (typeof objectId === 'string') {
      return mongoose.Types.ObjectId(objectId);
    }
    return objectId;
  } catch (error) {
    throw error;
  }
}

export function slugBuilder(text, options) {
  return slug(text, options);
}
