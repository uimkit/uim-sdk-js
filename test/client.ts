import UIMClient, { UIMClientOptions } from "../src"

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleXN0b3JlLUNIQU5HRS1NRSJ9.eyJqdGkiOiJOSUJrSWswYWpkV0lNM09COXpIWmMiLCJzdWIiOiJ3ZWNoYXQ6cGN8b1ptTjd4UG1lZzVXWGktYUt5SE91VHIteUtyVSIsImlhdCI6MTY2NjMyODE1NSwiZXhwIjoxNjY2NDE0NTU1LCJzY29wZSI6IiIsImNsaWVudF9pZCI6Ik9fTlVtUXJkVHIzV0xjV0RZbTlZTmhXS0RiTXUxTHdTIiwiaXNzIjoiaHR0cHM6Ly91aW0uY24uYXV0aG9rLmNuLyIsImF1ZCI6Imh0dHBzOi8vYXBpLnVpbWtpdC5jaGF0L2NsaWVudC92MSJ9.m3AXDbPEq4XEaa2bX9bICIIiX5TLEyQ9xpXsaLrLLS07BovSqZv_Nn_gNNFB9LO9fkaxm2ohCv1JZ890IswcdWi1CtPbElEPfxXksRIMOLmxpHrtK63Na0QVT8XmdI4yyYVzmdRIqIAWOxycRR0vHc4oMlLhf6tUd61_ush1dJWA0VIST6jB57swS_KiQALpo3toJGimRuYMPPemxCy2JnvKqIZDZ4Dskt4X__9uzr3TGmW6GByIytoN3wE4YqgvBacs03jJ-jmYB2nvfZ2Ctmob42nC82jPTZSsA18W1t6pEyg6ZPFxHiHKCKK10q1MkF2mvdi5K27k9DqApJhGKw"
const options: UIMClientOptions = {
  // baseUrl: "http://127.0.0.1:9000/client/v1/",
  subscribeKey: "sub-c-d74afc61-58ce-432d-9015-aa35e6cdc13e",
  publishKey: "pub-c-e41dbf7d-d0ab-4888-8b6b-fafeb36270ca",
  secretKey: "sec-c-NzAwOWM3YjktNTk0OC00MmY5LWJjMDQtMWY2N2M2Mzc0NWUy",
}

const createClient = (): UIMClient => {
  return new UIMClient(token, options)
}

export { createClient }
