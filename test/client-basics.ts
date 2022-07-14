import test from "ava"
import { Client } from "../src"
import { NewMessage } from "../src/pubsub-messages"

test("initialize client", t => {
  const uim = new Client("foo", {})
  uim.imAccounts.retrieve({ account_id: "xxxx" })
  uim.imAccounts.list({})
  uim.contacts.retrieve({ contact_id: "xxx" })
  uim.conversations.onNewMessage((evt: NewMessage): void => {
    const message = evt.payload
    console.log(message.from)
  })
  t.pass()
})
