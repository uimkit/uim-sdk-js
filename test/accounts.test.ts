import { buildClient } from './client';

describe('accounts', () => {
  const client = buildClient();

  it('list accounts', async () => {
    const listAccountsResp = await client.listAccounts({ provider: 'wechat' });
    console.log(JSON.stringify(listAccountsResp));

    // expect(listResp.data.length).toBeGreaterThan(0)
    // expect(listResp.extra.total).toBeGreaterThan(0)
    // console.log(JSON.stringify(listResp, undefined, 4));

    // const id = listResp.data[0]?.id!
    // const retrieveResp = await client.retrieveIMAccount({ account_id: id })
    // expect(retrieveResp.id).toBe(id)
    // console.log(JSON.stringify(retrieveResp, undefined, 4))
  });
});
