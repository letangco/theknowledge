import path from 'path';
import execa from 'execa';

// Stream
export function handleUploadStream(req, res) {
  console.log('req.files');
  console.log(req.files);
  res.json({status: 'ok'});
  // streamVideo();
}

function streamVideo() {
  const uploadDir = path.resolve(__dirname, '../../uploads/stream');
  console.log('streamVideo uploadDir', uploadDir);
  const videoName = popVideo(uploadDir);
  console.log('videoName', videoName);
  if ( videoName ) {
    // Begin stream
    const videoPath = `${uploadDir}/${videoName}`;
    const streamCmd = `ffmpeg -re -i ${videoPath} -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -hls_flags delete_segments -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv rtmp://localhost/live/tabvn`;
    console.log('streamCmd', streamCmd);
    execa.commandSync(streamCmd);
    removeVideo(videoPath);
    // Continue with next video
    // continueStream();
  } else {
    console.log('Popover');
  }
}

/**
 * Get the first video name of folder
 * @param: dir - location path of folder
 */
function popVideo(dir) {
  const popVideoNameCmd = `cd ${dir} && ls -t | head -n1 |awk '{printf(\"%s\",$0)}'`;
  let result = execa.commandSync(popVideoNameCmd);
  return result.stdout;
}

function removeVideo(videoPath) {
  // Remove the video after handle done
  const removeCmd = `rm ${videoPath}`;
  execa.commandSync(removeCmd);
}

// End stream
