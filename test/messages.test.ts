import { MessageType, TextMessagePayload } from "../src/models"
import { createClient } from "./client"

const client = createClient()

describe("messages", () => {
  it("send-private-message", async () => {
    const textMessage: TextMessagePayload = {
      type: MessageType.Text,
      body: {
        content: "你好啊",
      },
    }
    await client.sendPrivateMessage({
      from: "8b3f7f39-d27b-4e73-8290-d2949a79bc21@douyin",
      to: "f7942cb5-6177-4351-9eb7-5a958a10b94d@douyin",
      message: textMessage,
    })
  })
})
