import { buildClient } from './client';

describe('send_messages', () => {
  const client = buildClient();

  it('send text message to conversation', async () => {
		const sendReq = client.createTextMessage({
			conversation_id: '2BzIjJZ0uT_IjnxmT7koD',
			text: '我在的'
		})
		const message = await client.sendMessage(sendReq)
    console.log(JSON.stringify(message, undefined, 4));
  });
});
