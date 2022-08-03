import execa from 'execa';
import fs from "fs";
import slug from "slug";
import { removeFile } from "../removeFile";

export async function convertOgaToMP3(path, filename, destination) {
  try {
    if (fs.existsSync(path)) {
      let originalName = filename.split('.');
      let name_file = slug(originalName[0]);
      if (filename.includes(".oga") || filename.includes("_blob")) {
        execa.commandSync(`ffmpeg -i ${path} -acodec libmp3lame ${destination}/${name_file}.mp3`);
        await removeFile(path)
        return `${name_file}.mp3`
      }
    }
    return ""
  } catch (error) {
    console.log("Error convert audio : ", error)
  }
}
