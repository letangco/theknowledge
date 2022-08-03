import * as TeacherRegistrationService from '../services/teacherRegistration.service';

export async function updateTeacherRegistrationStatus(req, res) {
  try {
    const {
      id,
    } = req.params;
    const {
      status,
    } = req.body;
    await TeacherRegistrationService.updateTeacherRegistrationStatus(id, status);
    return res.json({
      success: true,
    })
  } catch (error) {
    console.error('updateTeacherRegistrationStatus error:', error);
    console.error(error);
    return res.status(500).send('Internal server error');
  }
}

export async function getTeacherRegistration(req, res) {
  try {
    const {
      page,
      rowPerPage,
    } = req.query;
    const data = await TeacherRegistrationService.getTeacherRegistration(page, rowPerPage);
    return res.json({
      success: true,
      payload: data,
    })
  } catch (error) {
    console.error('getTeacherRegistration error:', error);
    console.error(error);
    return res.status(500).send('Internal server error');
  }
}
