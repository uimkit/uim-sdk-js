import test from "ava"
import { Client } from "../src"

test("initialize client", t => {
  const uim = new Client({ auth: "foo" })
  uim.imAccounts.retrieve({ account_id: "xxxx" })
  uim.imAccounts.list({})
  uim.contacts.retrieve({ contact_id: "xxx" })
  t.pass()
})
