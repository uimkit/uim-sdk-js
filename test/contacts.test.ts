import { createClient } from "./client"

const client = createClient()

describe("contacts", () => {
	it("contacts-crud", async () => {
		const listResp = await client.listContacts({ account_id: 'Sax3MES_sIdvV0sQO9-co', cursor: '0_1665771200097' })
		// const listResp = await client.listContacts({ account_id: 'Sax3MES_sIdvV0sQO9-co' })
		console.log(JSON.stringify(listResp, undefined, 4))
		console.log(JSON.stringify(listResp.extra, undefined, 4))

		const retrieveResp = await client.retrieveContact({account_id: 'Sax3MES_sIdvV0sQO9-co', user_id: 'douyin|d28c5890-f115-41c7-9005-d88d8fa5b62a'})
		console.log(JSON.stringify( retrieveResp, undefined, 4))
	})
})
