import SendGridMail from '@sendgrid/mail';
import logger from '../server/util/log';
import serverConfig from '../server/config';
import emailTemplate from './locale.util';
import { DEFAULT_LANGUAGE, WORKER_NAME } from '../server/constants';
import AMPQ from '../rabbitmq/ampq';

SendGridMail.setApiKey(serverConfig.sendgridApiKey);

function loadTemplate(templateId, data, lang = 'vi') {
  const templateData = emailTemplate[lang]?.[templateId];
  if (templateData) {
    let html = templateData?.html;
    const subject = templateData?.subject;
    if (typeof data === 'object') {
      Object.keys(data).forEach((dataKey) => {
        html = html.replace(`{{${dataKey}}}`, data[dataKey]);
      });
    }
    return {
      html,
      subject,
    };
  }
  throw Error(`Email template is not defined: ${templateId}`);
}

export async function singleSendMail({
  from, to, subject, html
}) {
  try {
    await SendGridMail.send({
      from: {
        name: from.name,
        email: from.email,
      },
      to: to,
      subject: subject,
      html: html,
    });
    return true;
  } catch (error) {
    logger.error('SendGrid singleSendMail error:', error);
    logger.error(`SendGrid singleSendMail from, to, subject: ${from}, ${to}, ${subject}`);
    logger.error(`SendGrid singleSendMail html: ${html}`);
    throw error;
  }
}

/**
 * https://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/index.html
 * Send emails
 * @param {object} from
 * @param {string} from.name
 * @param {string} from.email
 * @param {string|array} to email, single email/an array of emails/email object {email, name}/array of email objects
 * @param {string} template
 * @param {object} data
 * @param {string} lang
 * @returns {Promise<boolean>}
 */
export async function sendEmail({
  from, to, template, data
}, lang = DEFAULT_LANGUAGE) {
  try {
    // Merge data to template
    const { html, subject } = loadTemplate(template, data, lang);
    if (!(to instanceof Array)) {
      to = [to];
    }
    to.forEach((email) => {
      if (email) {
        AMPQ.sendDataToQueue(WORKER_NAME.SEND_MAIL, {
          from: from,
          to: email,
          subject: subject,
          html: html,
        });
      }
    });
    return true;
  } catch (error) {
    logger.error('SendGrid sendEmail error:', error);
    logger.error(`SendGrid sendEmail from, to, lang:', ${from}, ${to}, ${lang}`);
    logger.error(`SendGrid sendEmail data: ${data}`);
    throw error;
  }
}
