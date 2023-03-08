import exp from 'constants';
import { buildClient } from './client';

describe('conversations', () => {
  const client = buildClient();

  /*
  it("list account's conversations", async () => {
    const resp1 = await client.listConversations({ account_id: 'gmtIYyV1ovBPegHPVNOKO', limit: 5 });
    expect(resp1.data.length).toBe(5);
    expect(resp1.extra.start_cursor).not.toBe('');
    expect(resp1.extra.end_cursor).not.toBe('');
    expect(resp1.extra.has_next).toBe(true);
    // expect(resp1.extra.has_previous).toBe(false); // TODO 这里错误要修复
    console.log(JSON.stringify(resp1, undefined, 4));

    const resp2 = await client.listConversations({
      account_id: 'gmtIYyV1ovBPegHPVNOKO',
      limit: 5,
      cursor: resp1.extra.end_cursor,
    });
    expect(resp2.data.length).toBe(5);
    expect(resp2.extra.start_cursor).not.toBe('');
    expect(resp2.extra.end_cursor).not.toBe('');
    expect(resp2.extra.has_next).toBe(true);
    expect(resp2.extra.has_previous).toBe(true);
    console.log(JSON.stringify(resp2, undefined, 4));

    const resp3 = await client.listConversations({ account_id: 'gmtIYyV1ovBPegHPVNOKO', limit: 10 });
    expect(resp3.data[0].id).toBe(resp1.data[0].id);
    expect(resp3.data[4].id).toBe(resp1.data[4].id);
    expect(resp3.data[5].id).toBe(resp2.data[0].id);
    expect(resp3.data[9].id).toBe(resp2.data[4].id);
  });
  */

  it('get conversation', async () => {
    const conversation = await client.getConversation('2BzIjJZ0uT_IjnxmT7koD');
    expect(conversation.id).toBe('2BzIjJZ0uT_IjnxmT7koD');
    expect(conversation.account).toBe('gmtIYyV1ovBPegHPVNOKO');
    console.log(JSON.stringify(conversation, undefined, 4));
  });
});
