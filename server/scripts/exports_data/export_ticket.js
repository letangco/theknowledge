import json2csv from 'json2csv';
import fs from 'fs'
import execa from 'execa';
import path from 'path'
import * as WebinarTicketServices from "../../services/webinarTicket.services";

const field = ['fullName', 'email', 'phoneNumber', 'ticket', 'dateCreated'];

export async function exportTicketCode(webinarId, userId) {
  try {
    let data = [], dataUser;
    let title = 'ticket' + '_' + Date.now() + '.csv';
    dataUser = await WebinarTicketServices.getAuthorBookedTickets(webinarId, userId);
    data = dataUser.map(e => {
      const date = new Date(e.created_at).toLocaleString();
      return {
        fullName: e.contactInfo.fullName,
        email: e.contactInfo.email,
        phoneNumber: e.contactInfo.phoneNumber,
        ticket: e.uniqueCode.join(' - '),
        dateCreated: date,
      }
    });
    let dir = path.join(__dirname, '..', '..', '..', 'exports', title);
    if (data.length > 0) {
      let shell_script = 'cd ' + path.join(__dirname, '..', '..', '..', 'exports') + ' && rm -f *.csv';
      await execa.command(shell_script);
      data = json2csv.parse(data, { field });
      await fs.writeFileSync(dir, data);
    } else {
      await fs.writeFileSync(dir, '');
    }
    return title;
  } catch (err) {
    console.log('err exportTicket : ', err);
    return Promise.reject({ status: 500, success: false, error: "Error!!" });
  }
}
