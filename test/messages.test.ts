import { ConversationType } from "../src"
import { createClient } from "./client"

const client = createClient()

describe("messages", () => {
  it("send-private-message", async () => {
    client.createTextMessage({
      conversation_type: ConversationType.Private,
      from: "",
      to: "",
      text: "",
    })
    client.createTextMessage({ conversation_id: "", text: "" })

    client.createImageMessage({ conversation_type: ConversationType.Private, from: "", to: "" })
  })
})
