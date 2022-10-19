import Client, { ClientOptions } from "../src/client"

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleXN0b3JlLUNIQU5HRS1NRSJ9.eyJqdGkiOiJvLTl2M1hJVGE1QW5oZ1E3M3FCSGwiLCJzdWIiOiJ3ZWNoYXQ6cGN8b1ptTjd4UG1lZzVXWGktYUt5SE91VHIteUtyVSIsImlhdCI6MTY2NjEyODI2NiwiZXhwIjoxNjY2MjE0NjY2LCJzY29wZSI6IiIsImNsaWVudF9pZCI6Ik9fTlVtUXJkVHIzV0xjV0RZbTlZTmhXS0RiTXUxTHdTIiwiaXNzIjoiaHR0cHM6Ly91aW0uY24uYXV0aG9rLmNuLyIsImF1ZCI6Imh0dHBzOi8vYXBpLnVpbWtpdC5jaGF0L2NsaWVudC92MSJ9.DITFybkXt9QdLc5ZN08tgDNtzVVCwsVYbM9lIQwQzZ5osto9VS19rHOkCQ6SFRgQ_f5E0Xi7PaYCA2PfYCtXe98senFQYphQrxnfjaBY1R3NbKjm2Zb52_p8gwOpaog9BEqyAJIaAlIGGwaGieEgGbkCaYRjYYfUwwaXf6bSJ7S_KZOboJ2LHC6j0p92nQh8YHibYmuqGmrMFJvTcjv4uUZrraQql3QzCkbLpsVqWVnVGbffwTqORmuT9Z7nBfRcdRXWFsIVRuGH_I1hrkB3mZ5SwAPUZbfZRKANaZDvfZ7iAkKR5zm_N-rEbzEETeG4xtr1bVEgYm5DNvmLvji8cw"
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
