import { buildClient } from './client';

describe('messages', () => {
  const client = buildClient();

  it('list conversation messages', async () => {
    const resp = await client.listMessages({ conversation_id: '2BzIjJZ0uT_IjnxmT7koD', limit: 5 });
    expect(resp.data.length).toBeGreaterThan(0);
    console.log(JSON.stringify(resp, undefined, 4));
  });

  it('delete message', async () => {
    const conversation1 = await client.getConversation('2BzIjJZ0uT_IjnxmT7koD');
    const lastMessageId = conversation1.last_message?.id;
    expect(lastMessageId).not.toBe('');
    await client.deleteMessage(lastMessageId!);
    const conversation2 = await client.getConversation('2BzIjJZ0uT_IjnxmT7koD');
    expect(conversation2.last_message).not.toBeUndefined();
    expect(conversation2.last_message).not.toBeNull();
    expect(conversation2.last_message?.id).not.toBe(lastMessageId);
  });
});
