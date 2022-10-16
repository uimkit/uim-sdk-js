import { createClient } from "./client"

const client = createClient()

describe("im-accounts", () => {
  it("list im accounts", async () => {
    await client.imAccounts.list({})
  })
})
