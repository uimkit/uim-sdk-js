import { buildClient } from './client';
import { relative } from 'path';

describe('send_messages', () => {
  jest.setTimeout(60000);
  const client = buildClient();

  // it('send text message to conversation', async () => {
  // 	const sendReq = client.createTextMessage({
  // 		conversation_id: '2BzIjJZ0uT_IjnxmT7koD',
  // 		text: '我在的',
  // 	});
  // 	const message = await client.sendMessage(sendReq);
  // 	console.log(JSON.stringify(message, undefined, 4));
  // });

  it('send image message to conversation', async () => {
    const sendReq = client.createImageMessage({
      conversation_id: '2BzIjJZ0uT_IjnxmT7koD',
      file: relative(process.cwd(), 'test/resources/test_image.jpeg'),
    });
    const message = await client.sendMessage(sendReq);
    console.log(JSON.stringify(message, undefined, 4));
  });
});
