import { buildClient } from './client';
import { readFileSync } from 'fs';
import { relative, basename } from 'path';

describe('publish_moments', () => {
  jest.setTimeout(300000);
  const client = buildClient();

  // it('publish text moment', async () => {
  //   const publishReq = client.createTextMoment({
  //     user_id: 'JTtg4oIp8R-rdWAIvmA2x',
  //     text: '🚀',
  //   });
  //   const moment = await client.publishMoment(publishReq);
  //   console.log(JSON.stringify(moment, undefined, 4));
  // });

  it('publish image moment', async () => {
    const file = loadFile('test/resources/test_image.jpeg');
    const publishReq = client.createImageMoment({
      user_id: 'JTtg4oIp8R-rdWAIvmA2x',
      files: [file],
    });
    const moment = await client.publishMoment(publishReq);
    console.log(JSON.stringify(moment, undefined, 4));
  });

  // it('send video message to conversation', async () => {
  //   const file = loadFile('test/resources/test_video.mp4');
  //   const sendReq = client.createVideoMessage({
  //     conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
  //     file,
  //     on_progress: (percent) => {
  //       console.log('upload progress: ' + percent);
  //     },
  //   });
  //   const message = await client.sendMessage(sendReq);
  //   console.log(JSON.stringify(message, undefined, 4));
  // });

  // it('send audio message to conversation', async () => {
  //   const file = loadFile('test/resources/test_audio.m4a');
  //   const sendReq = client.createAudioMessage({
  //     conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
  //     file,
  //   });
  //   const message = await client.sendMessage(sendReq);
  //   console.log(JSON.stringify(message, undefined, 4));
  // });
});

const loadFile = (path: string): File => {
  const buf = readFileSync(relative(process.cwd(), path));
  const ab = new ArrayBuffer(buf.length);
  const ua = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    ua[i] = buf[i];
  }
  return new File([ab], basename(path));
};
