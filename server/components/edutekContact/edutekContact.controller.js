import * as EdutekContactService from './edutekContact.service';

/**
 * Send email contact
 * @returns {Promise.<{}>}
 */
export async function sendEmailContact(req, res, next) {
  try {
    await EdutekContactService.sendEmailContact(req.body);
    return res.json({
      success: true,
    });
  } catch (error) {
    return next(error);
  }
}
