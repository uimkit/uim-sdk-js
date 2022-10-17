import Client, { ClientOptions } from "../src/client"

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleXN0b3JlLUNIQU5HRS1NRSJ9.eyJqdGkiOiJMQU10MkNva2ZkVzd1Z0ZISkVXLWciLCJzdWIiOiJ3ZWNoYXQ6cGN8b1ptTjd4UG1lZzVXWGktYUt5SE91VHIteUtyVSIsImlhdCI6MTY2NTk5ODQzOCwiZXhwIjoxNjY2MDg0ODM4LCJzY29wZSI6IiIsImNsaWVudF9pZCI6Ik9fTlVtUXJkVHIzV0xjV0RZbTlZTmhXS0RiTXUxTHdTIiwiaXNzIjoiaHR0cHM6Ly91aW0uY24uYXV0aG9rLmNuLyIsImF1ZCI6Imh0dHBzOi8vYXBpLnVpbWtpdC5jaGF0L2NsaWVudC92MSJ9.Cf-MQJk6ysZEFika2hCDao1bIrpqmCfbe4e3q_TzdQWxzOQIlgX8WZEHYj3SxH5JBBLuLTlQFM-P1t9TICQvuxk7hD-wkgOdOiqauj8LUvsdDEi3T2dizsRwCtV0oExQ5JwOOqQcvYs4Jkfm5CHgyNYxdB0re13XgsYpi3745pN1jmAbjZ1BmiYr4xfaKxb6U5MhTvWM_cTq-66fJaWVNK0a3EXk2AC3kTkAvKAChk5OEbOGtedo-KVtPN_ORyBPRUElz0PrZ6MGPUIjf63Kq75f4iajmMp1tfpluIkaYE_-KpIC0WmyuhN6SR2rcuBOynEvkrGW_82cJNvRBkGGkg"
const options: ClientOptions = {
  baseUrl: "http://127.0.0.1:9000/client/v1/",
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
