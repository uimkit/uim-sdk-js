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
      from: "Sax3MES_sIdvV0sQO9-co@douyin",
      to: "f7942cb5-6177-4351-9eb7-5a958a10b94d@douyin",
      message: textMessage,
    })
  })
})
