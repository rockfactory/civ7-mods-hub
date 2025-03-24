/// <reference path="../pb_data/types.d.ts" />

onRecordsListRequest((e) => {
  const requestInfo = e.requestInfo();
  if (requestInfo.headers?.['x_version'] != null) {
    $app
      .logger()
      .debug(
        'Mods request',
        'version',
        requestInfo.headers['x_version'],
        'platform',
        requestInfo.headers['sec_ch_ua_platform'],
        'userAgent',
        requestInfo.headers['user_agent'],
        'userIP',
        e.realIP()
      );
  }

  e.next();
}, 'mods');
