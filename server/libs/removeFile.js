import fs from "fs";
import rimraf from 'rimraf';
export async function remove_file(path, files) {
  try {
    let promise = files.map(async e => {
      let p = `${path}/${e}`;
      if (fs.existsSync(p)) {
        await fs.unlinkSync(p);
      }
    });
    await Promise.all(promise);
  } catch (error) {
    throw error;
  }
}

export async function removeDir(path) {
  await rimraf.sync(path);
}

export async function removeFile(path) {
  if (fs.existsSync(path)) {
    await fs.unlinkSync(path);
  }
}

export async function removeMultiFile(files) {
  let promise = files.map(async e => {
    if (e.path) {
      await removeFile(e.path);
    }
  });
  await Promise.all(promise);
}
