import { createClient } from "./client"

const client = createClient()
// const accountId = 'rg-y6JnVJZftxhSshrChc'
// const accountId = 'Sax3MES_sIdvV0sQO9-co' // 测试环境抖音
const accountId = 'PDd4lp5rexe_24_uQBOE5' // 测试环境微信

describe("contacts", () => {
	it("add-contact", async () => {
		const resp = await client.addContact({ account_id: accountId, contact: "13000000001", hello_message: "hi" })
		console.log(JSON.stringify(resp, undefined, 4))
	})
	// it("contacts-crud", async () => {
	// 	const listResp = await client.listContacts({ account_id: accountId })
	// 	console.log(JSON.stringify(listResp, undefined, 4))
	// 	console.log(JSON.stringify(listResp.extra, undefined, 4))

	// 	const retrieveResp = await client.retrieveContact({account_id: accountId, user_id: 'douyin|d28c5890-f115-41c7-9005-d88d8fa5b62a'})
	// 	console.log(JSON.stringify( retrieveResp, undefined, 4))
	// })
})
