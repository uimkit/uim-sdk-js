import Client, { ClientOptions } from "../src/client"

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleXN0b3JlLUNIQU5HRS1NRSJ9.eyJqdGkiOiJsSE1rYS12eFgyN3h0SGlTUXNtQzUiLCJzdWIiOiJ3ZWNoYXQ6cGN8b1ptTjd4UG1lZzVXWGktYUt5SE91VHIteUtyVSIsImlhdCI6MTY2NjAyOTgwNCwiZXhwIjoxNjY2MTE2MjA0LCJzY29wZSI6IiIsImNsaWVudF9pZCI6Ik9fTlVtUXJkVHIzV0xjV0RZbTlZTmhXS0RiTXUxTHdTIiwiaXNzIjoiaHR0cHM6Ly91aW0uY24uYXV0aG9rLmNuLyIsImF1ZCI6Imh0dHBzOi8vYXBpLnVpbWtpdC5jaGF0L2NsaWVudC92MSJ9.uerULyeLNhuptPHEx86IX7INRdLBRf5VsYHs-c7TpGN8haSiig_89oP50AEFbExameeKW0y8WhtDgHT1nHCQIcVO7OEFqiKpLFG41MTA-KJuZmpnVEzlNagTe3TsQZVGEt2m1cpwYk944SklmrnqfFNXcRJKd9P8-AU3trT9uWNZVZX5bBqjSXY7dJ30dgY8_o-b-Wja1inQCy3w5lobSjnExh6qsLC4coTJuWLq0bFkdP0QeHcrSslhzXnyoqr7JzEcTxukEfCcEPslegfL2gL7cwW9Cwq6bfmpmow3BTD5hdrwIp9ebkCIzRp1eLScSEK-PB2lgm58JvvRLMGxdA"
const options: ClientOptions = {
  // baseUrl: "http://127.0.0.1:9000/client/v1/",
  pubsubOptions: {
    subscribeKey: "sub-c-d74afc61-58ce-432d-9015-aa35e6cdc13e",
    publishKey: "pub-c-e41dbf7d-d0ab-4888-8b6b-fafeb36270ca",
    secretKey: "sec-c-NzAwOWM3YjktNTk0OC00MmY5LWJjMDQtMWY2N2M2Mzc0NWUy",
    uuid: "uim-sdk-js-test",
  },
}

const createClient = (): Client => {
  return new Client(token, options)
}

export { createClient }
