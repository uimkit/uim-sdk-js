import { buildClient } from './client';

describe('accounts', () => {
  const client = buildClient();

  it('list accounts', async () => {
    const listAccountsResp = await client.listAccounts({ provider: 'wechat' });
    expect(listAccountsResp.data.length).toBeGreaterThan(0);
    expect(listAccountsResp.extra.total).toBeGreaterThan(0);
    console.log(JSON.stringify(listAccountsResp, undefined, 4));
  });
});
