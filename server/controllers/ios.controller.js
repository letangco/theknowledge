import Configs from '../config';

export async function getVersion(req, res) {
  try {
    return res.json({
      version: Configs.version_ios
    })
  }catch (err) {
    return res.status(err.status || 500).json(err)
  }
}
