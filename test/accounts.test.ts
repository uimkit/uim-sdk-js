import { APIErrorCode, APIResponseError } from '../src/errors';
import { Gender } from '../src/models';
import { buildClient } from './client';

describe('accounts', () => {
  const client = buildClient();

  it('list accounts', async () => {
    const listAccountsResp = await client.listAccounts({ provider: 'wechat' });
    expect(listAccountsResp.data.length).toBeGreaterThan(0);
    expect(listAccountsResp.extra.total).toBeGreaterThan(0);
    console.log(JSON.stringify(listAccountsResp, undefined, 4));
  });

  it('get account', async () => {
    const account = await client.getAccount('7QWyWEYmpgJQFi_f5nQP2');
    expect(account.id).toBe('7QWyWEYmpgJQFi_f5nQP2');
    expect(account.nickname).not.toBe('');
    expect(account.nickname).not.toBeUndefined();
    expect(account.nickname).not.toBeNull();
    expect(account.gender).toBe(Gender.Male);
    console.log(JSON.stringify(account, undefined, 4));

    try {
      await client.getAccount('abcde');
    } catch (e) {
      const apiErr = e as APIResponseError;
      expect(apiErr.code).toBe(APIErrorCode.Unauthorized);
      expect(apiErr.message).not.toBe('');
      expect(apiErr.message).not.toBeUndefined();
      expect(apiErr.message).not.toBeNull();
      console.log(`[${apiErr.code}] ${apiErr.message}`);
    }
  });
});
