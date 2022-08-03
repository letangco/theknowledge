import UserPaymentMethod from '../models/userPaymentMethod';
import User from '../models/user';
import sanitizeHtml from 'sanitize-html';
import globalConstants from '../../config/globalConstants';

export async function addUserPaymentMethod(req, res) {
  try {
    let user = await User.findById(req.user._id, 'defaultPaymentMethod');
    let created = await UserPaymentMethod.addNew(UserPaymentMethod, user, req.body);

    return res.json({success: true, data: created});
  } catch (err) {
    if(err.err === 'added') {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    console.log('err on addUserPaymentMethod:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function setDefaultPaymentMethod(req, res) {
  try {
    let paymentMethod = await UserPaymentMethod.findById(req.params.id);
    await User.update({_id: req.user._id}, {$set: {defaultPaymentMethod: paymentMethod._id}});
    return res.json({success: true});
  } catch (err) {
    console.log('err on setDefaultPaymentMethod:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function updatePaymentMethod(req, res) {
  try {
    let paymentMethod = await UserPaymentMethod.findById(req.params.id);

    if(!paymentMethod) {
      return res.status(404).json({success: false, error: 'Payment method not found.'});
    }

    if(paymentMethod.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({success: false, error: 'Permission denied.'});
    }

    if(req.body.type) {
      let type = sanitizeHtml(req.body.type);
      if (!type in globalConstants.methodTypes) {
        return res.status(400).json({success: false, error: 'Invalid type.'});
      }
      paymentMethod.type = type;
      paymentMethod.dateUpdated = new Date()
    }

    if(req.body.detail) {
      let detail = req.body.detail;
      for (let key in detail) {
        detail[key] = sanitizeHtml(detail[key]);
      }
      paymentMethod.detail = detail;
      paymentMethod.dateUpdated = new Date()
    }

    let user = await User.findById(req.user._id, 'defaultPaymentMethod');
    let promises = [paymentMethod.save()];

    if('default' in req.body) {
      console.log('default:', String(req.body.default).valueOf());
      if(String(req.body.default).valueOf() === "true") {
        user.defaultPaymentMethod = paymentMethod._id;
      } else if(String(req.body.default).valueOf() === "false") {
        console.log('thay day ko?');
        user.defaultPaymentMethod = undefined;
      }
      promises.push(user.save());
    }

    await Promise.all(promises);

    return res.json({success: true, data: paymentMethod});
  } catch (err) {
    console.log('err on updatePaymentMethod:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function deletePaymentMethod(req, res) {
  try {
    let results = await Promise.all([
      UserPaymentMethod.findById(req.params.id),
      User.findById(req.user._id, 'defaultPaymentMethod')
    ]);

    let user = results[1];
    let paymentMethod = results[0];

    if(!paymentMethod) {
      return res.status(404).json({success: false, error: 'Payment method not found.'});
    }

    if(paymentMethod.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({success: false, error: 'Permission denied.'});
    }

    if(user.defaultPaymentMethod && user.defaultPaymentMethod.toString() === paymentMethod._id.toString()) {
      return res.status(400).json({success: false, error: 'You can not delete default payment method.'});
    }
    await paymentMethod.remove();

    return res.json({success: true});
  } catch (err) {
    console.log('err on deletePaymentMethod:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function getPaymentMethods(req, res) {
  try {
    let rs = await Promise.all([
      UserPaymentMethod.find({user: req.user._id}).sort({dateAdded: -1}),
      User.findById(req.user._id, 'defaultPaymentMethod')
    ]);
    let paymentMethods = JSON.parse(JSON.stringify(rs[0]));
    let defaultMethod = rs[1].defaultPaymentMethod && rs[1].defaultPaymentMethod ? rs[1].defaultPaymentMethod.toString() : '';
    paymentMethods = paymentMethods.map(method => {
      method.default = defaultMethod === method._id.toString();
      return method;
    });
    return res.json({
      success: true,
      data: paymentMethods
    });
  } catch (err) {
    console.log('err on getPaymentMethods:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function getPaymentMethod(req, res) {
  try {
    let rs = await Promise.all([
      UserPaymentMethod.findOne({_id: req.params.id, user: req.user._id}),
      User.findById(req.user._id, 'defaultPaymentMethod')
    ]);
    let paymentMethod = rs[0];
    if(!paymentMethod) {
      return res.status(404).json({success: false, error: 'Payment method not found.'});
    }
    paymentMethod = JSON.parse(JSON.stringify(paymentMethod));
    paymentMethod.default = rs[1].defaultPaymentMethod && rs[1].defaultPaymentMethod.toString() === paymentMethod._id.toString();
    return res.json({success: true, data: paymentMethod});
  } catch (err) {
    console.log('err on getPaymentMethod:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}
