import * as CheckinWebinarServices from '../services/checkinWebinar.services';

export async function createCheckin(req, res) {
  try {
    let checkinOptions = {
      webinar: req.body.webinar,
      ticketCode: req.body.ticketCode,
      user: req.body.user
    };

    let checkin = await CheckinWebinarServices.createCheckin(checkinOptions);

    return res.status(200).json({
      success: true,
      data: checkin
    });
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
