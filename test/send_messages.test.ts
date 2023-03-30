import { buildClient } from './client';
import { readFileSync } from 'fs'
import { relative, basename } from 'path'

describe('send_messages', () => {
  jest.setTimeout(300000);
  const client = buildClient();

  it('send text message to conversation', async () => {
    const sendReq = client.createTextMessage({
      conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
      text: '我在的',
    });
    const messageId = sendReq.id;
    console.log('message id: %s', messageId);
    const message = await client.sendMessage(sendReq);
    console.log(JSON.stringify(message, undefined, 4));
    expect(message.id).toBe(messageId);
  });

  it('send text message to contact', async () => {
    const sendReq = client.createTextMessage({
      from: 'JTtg4oIp8R-rdWAIvmA2x',
      to: 'NZU_jTLhwj6pm0jpeiQeK',
      text: '应该可以了',
    });
    const message = await client.sendMessage(sendReq);
    console.log(JSON.stringify(message, undefined, 4));
  });

  it('send image message to conversation', async () => {
    const file = loadFile("test/resources/test_image.jpeg")
    const sendReq = client.createImageMessage({
      conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
      file,
    });
    const message = await client.sendMessage(sendReq);
    console.log(JSON.stringify(message, undefined, 4));
  });

  it('send video message to conversation', async () => {
    const file = loadFile("test/resources/test_video.mp4")
    const sendReq = client.createVideoMessage({
      conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
      file,
      on_progress: (percent) => {
        console.log('upload progress: ' + percent);
      },
    });
    const message = await client.sendMessage(sendReq);
    console.log(JSON.stringify(message, undefined, 4));
  });

  it('send audio message to conversation', async () => {
    const file = loadFile("test/resources/test_audio.m4a")
    const sendReq = client.createAudioMessage({
      conversation_id: 'kixVL6qOfz9xLcPe_xzpA',
      file
    });
    const message = await client.sendMessage(sendReq);
    console.log(JSON.stringify(message, undefined, 4));
  });
});

const loadFile = (path: string): File => {
  const buf = readFileSync(relative(process.cwd(), path))
  const ab = new ArrayBuffer(buf.length)
  const ua = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    ua[i] = buf[i];
  }
  return new File([ab], basename(path));
}