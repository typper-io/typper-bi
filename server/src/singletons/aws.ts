import * as AWS from 'aws-sdk'

export const secretManager = new AWS.SecretsManager({
  region: 'us-east-1',
  accessKeyId: process.env.SECRET_AWS_ACCESS_KEY,
  secretAccessKey: process.env.SECRET_AWS_SECRET_KEY,
})

export const s3 = new AWS.S3({
  region: 'us-east-1',
  accessKeyId: process.env.SECRET_AWS_ACCESS_KEY,
  secretAccessKey: process.env.SECRET_AWS_SECRET_KEY,
})
