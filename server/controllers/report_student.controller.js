import * as Report_Student_Service from '../services/report_student.services';
const LIMIT = 10;

export async function getReportStudent(req, res) {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || LIMIT;
    let skip = (page - 1) * limit;
    let status = Number(req.query.status) || 0;
    let support = Number(req.query.support) || 0;
    let date = Number(req.query.date) || null;
    let text = req.query.search || '';
    let options = {
      status,
      support,
      date,
      text,
      limit,
      skip
    };
    let data = await Report_Student_Service.getReportStudent(options);
    return res.json({
      success: true,
      total_page: Math.ceil(data[0]/limit),
      total_item: data[0],
      page,
      item: data[1].length,
      data: data[1]
    })
  }catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function getCourseByUser(req, res) {
  try {
    let langCode = req.headers.lang || 'en';
    let id = req.params.id || null;
    let requesterId = req.user._id;
    let time = req.query.time || 0;
    if (!id){
      throw {
        status: 400,
        success: false,
        error: 'Invalid Params.'
      }
    }
    let data = await Report_Student_Service.getCourseByUser(id, requesterId , time,langCode);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function editReportStudent(req, res) {
  try {
    let options = req.body;
    options.id = req.user._id;
    let data = await Report_Student_Service.editReportStudent(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function adminNoteUser(req, res) {
  try {
    let options = req.body;
    options.supporter = req.user._id;
    options.date = Date.now();
    let data = await Report_Student_Service.adminNoteUser(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function adminDeleteNote(req, res) {
  try {
    let id = req.params.id;
    await Report_Student_Service.adminDeleteNote(id);
    return res.json({
      success:true
    });
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}
