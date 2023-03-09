import { buildClient } from './client';

describe('messages', () => {
  const client = buildClient();

  it('list conversation messages', async () => {
    const resp = await client.listMessages({ conversation_id: '2BzIjJZ0uT_IjnxmT7koD', limit: 5 });
    expect(resp.data.length).toBeGreaterThan(0);
    console.log(JSON.stringify(resp, undefined, 4));
  });

  // it('get account', async () => {
  //   const account = await client.getAccount('gmtIYyV1ovBPegHPVNOKO');
  //   expect(account.id).toBe('gmtIYyV1ovBPegHPVNOKO');
  //   expect(account.nickname).not.toBe('');
  //   expect(account.nickname).not.toBeUndefined();
  //   expect(account.nickname).not.toBeNull();
  //   expect(account.gender).toBe(Gender.Male);
  //   console.log(JSON.stringify(account, undefined, 4));
  // });
});
