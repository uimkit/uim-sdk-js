import { createClient } from "./client"

const client = createClient()

describe("im-accounts", () => {
  it("list-im-accounts", async () => {
    const resp = await client.imAccounts.list({})
    expect(resp.data.length).toBeGreaterThan(0)
    expect(resp.extra.total).toBeGreaterThan(0)
    // console.log(JSON.stringify(resp, undefined, 4))
  })

  it("retrieve-im-account", async () => {
    const resp = await client.imAccounts.retrieve({ account_id: "Sax3MES_sIdvV0sQO9-co" })
    console.log(JSON.stringify(resp, undefined, 4))
  })
})
