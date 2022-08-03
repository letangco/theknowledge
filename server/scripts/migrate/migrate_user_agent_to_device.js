import StreamInviteTracking from '../../models/streamInviteTracking';
import UserViewStreamTracking from '../../models/userViewStreamTracking';
import uaParser from 'ua-parser-js';

async function migrateUserViewStreamTracking() {
  const userViewStreamTracking = await UserViewStreamTracking.find({device: {$ne: null}});
  let length = userViewStreamTracking.length;
  console.log('we have', length, 'userViewStreamTracking');
  for ( let index = 0; index < length; index++ ) {
    const tracking = userViewStreamTracking[index];
    if ( tracking.device ) {
      let ua = uaParser(tracking.device);

      tracking.device = {
        browser: ua.browser,
        osName: ua.os.name,
        osVersion: ua.os.version,
        platform: 'web',
      };

      await tracking.save();
    }
  }
}

async function migrateStreamInviteTracking() {
  const streamInviteTracking = await StreamInviteTracking.find({device: {$ne: null}});
  let length = streamInviteTracking.length;
  console.log('we have', length, 'StreamInviteTracking');
  for ( let index = 0; index < length; index++ ) {
    const tracking = streamInviteTracking[index];
    if ( tracking.device ) {
      let ua = uaParser(tracking.device);

      tracking.device = {
        browser: ua.browser,
        osName: ua.os.name,
        osVersion: ua.os.version,
        platform: 'web',
      };
      await tracking.save();
      /**
       * {
          browser: {
            fullVersion: "72.0.3626.121"
            isChrome: true
            isPrivateBrowsing: false
            name: "Chrome"
            version: 72
          },
          osName: DetectRTC.osName,
          osVersion: DetectRTC.osVersion,
          displayResolution: DetectRTC.displayResolution,
          isMobileDevice: DetectRTC.isMobileDevice,
          hasMicrophone: DetectRTC.hasMicrophone,
          hasSpeakers: DetectRTC.hasSpeakers,
          hasWebcam: DetectRTC.hasWebcam,
          platform: 'web',
        }
       */
    }
  }
}

(async function() {
  // try {
  //   await migrateStreamInviteTracking();
  // } catch (error) {
  //   console.error('migrateStreamInviteTracking failed:');
  //   console.error(error);
  // }
  // try {
  //   await migrateUserViewStreamTracking();
  // } catch (error) {
  //   console.error('migrateUserViewStreamTracking failed:');
  //   console.error(error);
  // }
})();