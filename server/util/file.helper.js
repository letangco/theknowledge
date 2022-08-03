import fs from 'fs';
import execa from 'execa';
import logger from './log';

/**
 * Remove local file on server with filePath
 * @param filePath
 * @returns {boolean}
 */
export function removeFile(filePath) {
  if (!filePath) {
    return true;
  }
  try {
    execa.command(`rm ${filePath}`);
    return true;
  } catch (error) {
    logger.error('removeFile execa error:', error);
    logger.error('removeFile execa error, filePath:', filePath);
    throw error;
  }
}

/**
 * Remove local files on server with filePath
 * @param filesPath
 * @returns {boolean}
 */
export function removeFiles(filesPath) {
  if (!filesPath?.length) {
    return true;
  }
  try {
    filesPath = filesPath.join(' ');
    execa.command(`rm ${filesPath}`);
    return true;
  } catch (error) {
    logger.error('removeFiles execa error:', error);
    logger.error('removeFiles execa error, filesPath:', filesPath);
    throw error;
  }
}

/**
 * Create folder if not existed
 * @param path
 * @returns {boolean}
 */
export function mkDir(path) {
  if (!path) {
    return true;
  }
  try {
    if (!fs.existsSync(path)) {
      execa.commandSync(`mkdir -p ${path}`);
    }
    return true;
  } catch (error) {
    logger.error('mkdir error:');
    logger.error(error);
    throw error;
  }
}
