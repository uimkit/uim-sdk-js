import { ConversationUpdatedEvent, MessageReceivedEvent, UIMEventType } from '../src/events';
import { buildClient } from './client';

describe('events', () => {
  jest.setTimeout(3600000);
  const client = buildClient();

  it('listen events', async () => {
    const onMessageReceived = (evt: MessageReceivedEvent) => {
      console.log('received message event: ', evt);
    };

    const onConversationUpdated = (evt: ConversationUpdatedEvent) => {
      console.log('conversation updated event: ', evt);
    };

    client.on(UIMEventType.MESSAGE_RECEIVED, onMessageReceived);
    client.on(UIMEventType.CONVERSATION_UPDATED, onConversationUpdated);

    await client.getAccountList({ provider: 'wechat' });
  });
});
