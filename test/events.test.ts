import { MessageReceivedEvent, UIMEventType } from '../src/events';
import { buildClient } from './client';

describe('events', () => {
  const client = buildClient();

  it('listen events', async () => {
    const onMessageReceived = (evt: MessageReceivedEvent) => {
      console.log('received message event: ', evt)
    }
    client.on(UIMEventType.MESSAGE_RECEIVED, onMessageReceived)
    await client.getAccountList({ subscribe: true })
    client.off(UIMEventType.MESSAGE_RECEIVED, onMessageReceived)
  });

});
