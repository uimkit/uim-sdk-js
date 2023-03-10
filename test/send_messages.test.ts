import { buildClient } from './client';
import { relative } from 'path';

describe('send_messages', () => {
	jest.setTimeout(300000);
	const client = buildClient();

	// it('send text message to conversation', async () => {
	// 	const sendReq = client.createTextMessage({
	// 		conversation_id: '2BzIjJZ0uT_IjnxmT7koD',
	// 		text: '我在的',
	// 	});
	// 	const message = await client.sendMessage(sendReq);
	// 	console.log(JSON.stringify(message, undefined, 4));
	// });

	// it('send image message to conversation', async () => {
	// 	const sendReq = client.createImageMessage({
	// 		conversation_id: '2BzIjJZ0uT_IjnxmT7koD',
	// 		file: relative(process.cwd(), 'test/resources/test_image.jpeg'),
	// 	});
	// 	const message = await client.sendMessage(sendReq);
	// 	console.log(JSON.stringify(message, undefined, 4));
	// });

	// it('send video message to conversation', async () => {
	// 	const sendReq = client.createVideoMessage({
	// 		conversation_id: '2BzIjJZ0uT_IjnxmT7koD',
	// 		file: relative(process.cwd(), 'test/resources/test_video.mp4'),
	// 	});
	// 	const message = await client.sendMessage(sendReq);
	// 	console.log(JSON.stringify(message, undefined, 4));
	// });

	it('send audio message to conversation', async () => {
		const sendReq = client.createAudioMessage({
			conversation_id: '2BzIjJZ0uT_IjnxmT7koD',
			file: relative(process.cwd(), 'test/resources/test_audio.m4a'),
		});
		const message = await client.sendMessage(sendReq);
		console.log(JSON.stringify(message, undefined, 4));
	});
});
