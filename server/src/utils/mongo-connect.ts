import mongoose, { ConnectionStates } from 'mongoose'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const mongoConnect = async (
  credentials: string,
  client?: typeof mongoose,
) => {
  if (client) {
    if (client.connection.readyState === ConnectionStates.connected) {
      return client
    }

    if (client.connection.readyState === ConnectionStates.connecting) {
      await sleep(100)

      return mongoConnect(credentials, client)
    }
  }

  const newClient = await mongoose.connect(credentials)

  if (newClient.connection.readyState === ConnectionStates.connected) {
    return newClient
  }

  if (newClient.connection.readyState === ConnectionStates.connecting) {
    await sleep(100)

    return mongoConnect(credentials, newClient)
  }

  throw new Error('Could not connect to mongo')
}
