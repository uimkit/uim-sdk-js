import { buildClient } from './client';

describe('moments', () => {
  jest.setTimeout(300000);
  const client = buildClient();

  it('list contact moments', async () => {
    const resp1 = await client.getContactMomentList({ contact_id: '7y0IpW041rFH-LOgvvJJi' });
    console.log(JSON.stringify(resp1, undefined, 4));
  });
});
