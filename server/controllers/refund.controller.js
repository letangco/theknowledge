import * as RefundServices from '../services/refund.services';
import StringHelper from '../util/StringHelper';

export async function adminGetRefunds(req, res) {
  try {
    let data = await RefundServices.getRefundRequests(req.user._id);
    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function adminApproveRefund(req, res) {
  try {
    let refundId = req.params.id;
    if(!StringHelper.isObjectId(refundId)) {
      return res.status(404).json({success: false, error: 'Refund not found.'});
    }

    await RefundServices.adminApproveRefund(req.user._id, refundId, req.body.notes, req.body.status);

    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
