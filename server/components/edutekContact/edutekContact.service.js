import logger from '../../util/log';
import { sendEmail } from '../../../mailService/SendGrid';
import { EDUTEK_CONTACT_MAIL } from '../../../config/config';

/**
 * Send email to edutek supporter
 * @param data
 * @param data.name
 * @param data.email
 * @param data.phone
 * @param data.message
 * @returns {Promise<void>}
 */
export async function sendEmailContact(data) {
  try {
    sendEmail({
      from: {
        email: data.email,
        name: data.name,
      },
      to: EDUTEK_CONTACT_MAIL,
      template: 'edutekContact',
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
      },
    }).catch((error) => {
      logger.error('EdutekContactService sendEmailContact, send email error:');
      logger.error(error);
    });
    return true;
  } catch (error) {
    logger.error('EdutekContactService, sendEmailContact error:');
    logger.error(error);
    throw error;
  }
}
