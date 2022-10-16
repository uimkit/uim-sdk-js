import Client, { ClientOptions } from "../src/client"

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleXN0b3JlLUNIQU5HRS1NRSJ9.eyJqdGkiOiJTOFg4SUlXdzd4dHUyMjZ6aXVSTHgiLCJzdWIiOiJ3ZWNoYXQ6cGN8b1ptTjd4UG1lZzVXWGktYUt5SE91VHIteUtyVSIsImlhdCI6MTY2NTg5MzM2MCwiZXhwIjoxNjY1OTc5NzYwLCJzY29wZSI6IiIsImNsaWVudF9pZCI6Ik9fTlVtUXJkVHIzV0xjV0RZbTlZTmhXS0RiTXUxTHdTIiwiaXNzIjoiaHR0cHM6Ly91aW0uY24uYXV0aG9rLmNuLyIsImF1ZCI6Imh0dHBzOi8vYXBpLnVpbWtpdC5jaGF0L2NsaWVudC92MSJ9.cG6JLwc3-3UUFbG6fSABeqs2A06FRfoo1rFrFBHXKpWuropEFZfk7VwLE8T9AVuwdfEziFnx8g2umAf37C-pdZsMqWFD4rTOLbzdxl89cIc9e9RVGh5ZDq53dlbkhh3XhaWydKJivRuAqdHeZUyZSCj8aqIVXDauzTMJUNi0f1l_s9KnQH5dfIEdw5z9lkmEQx83r0mVXt7Zt04ol_xZ3Z8sTBIyk9kpOeupQC02OSmym8zqBqW_2oKh5DCRwvIrjWl5rf9ImHsa9m2CawprKboFFKO19-UNhGWda00LDXO4lV_RGsEUylxvV2_SeCrExOAUVfqb51AcD7OFvE-qKQ"
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
