import { Injectable } from '@nestjs/common'
import { Engines } from '@prisma/client'
import { secretManager } from 'src/singletons/aws'
import { decrypt, encrypt } from 'src/utils/encryption'

@Injectable()
export class CredentialsService {
  async createCredentialsByProvider({
    provider,
    credentials,
    dataSourceId,
  }: {
    dataSourceId: string
    provider: Engines
    credentials: any
  }) {
    if (provider === 'Postgres' || provider === 'Redshift') {
      const { dataSourceName, password, port, host, user } = credentials

      return Promise.all([
        this.createSecret({
          Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-user`,
          SecretString: user,
        }),
        this.createSecret({
          Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-host`,
          SecretString: host,
        }),
        this.createSecret({
          Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-database`,
          SecretString: dataSourceName,
        }),
        this.createSecret({
          Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-password`,
          SecretString: password as string,
        }),
        this.createSecret({
          Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-port`,
          SecretString: String(port),
        }),
      ])
    }

    if (provider === 'Mongo') {
      return this.createSecret({
        Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-credentials`,
        SecretString: credentials,
      })
    }

    if (provider === 'Sheets') {
      return this.createSecret({
        Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-spreadsheetId`,
        SecretString: credentials.spreadsheetId,
      })
    }

    if (provider === 'BigQuery') {
      return this.createSecret({
        Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-credentials`,
        SecretString: credentials,
      })
    }
  }

  async getCredentialsByProvider({
    provider,
    dataSourceId,
  }: {
    dataSourceId: string
    provider: Engines
  }): Promise<any> {
    if (provider === 'Postgres' || provider === 'Redshift') {
      const dataSourceSecrets = await Promise.all([
        this.getSecretValue({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-user`,
        }),
        this.getSecretValue({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-host`,
        }),
        this.getSecretValue({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-database`,
        }),
        this.getSecretValue({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-password`,
        }),
        this.getSecretValue({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-port`,
        }),
      ])

      const [user, host, dataSourceName, password, port] = dataSourceSecrets

      return { user, host, dataSourceName, password, port }
    }

    if (provider === 'Mongo') {
      return this.getSecretValue({
        SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-credentials`,
      })
    }

    if (provider === 'Sheets') {
      const dataSourceSecrets = await Promise.all([
        this.getSecretValue({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-databaseName`,
        }).catch(() => ''),
        this.getSecretValue({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-spreadsheetId`,
        }),
      ])

      const [databaseName, spreadsheetId] = dataSourceSecrets

      return { databaseName, spreadsheetId }
    }

    if (provider === 'BigQuery') {
      return this.getSecretValue({
        SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-credentials`,
      })
    }
  }

  async deleteCredentialsByProvider({
    provider,
    dataSourceId,
  }: {
    dataSourceId: string
    provider: Engines
  }) {
    if (provider === 'Postgres' || provider === 'Redshift') {
      return Promise.all([
        this.deleteSecret({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-user`,
        }),
        this.deleteSecret({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-host`,
        }),
        this.deleteSecret({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-database`,
        }),
        this.deleteSecret({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-password`,
        }),
        this.deleteSecret({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-port`,
        }),
      ])
    }

    if (provider === 'Mongo') {
      return this.deleteSecret({
        SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-credentials`,
      })
    }

    if (provider === 'Sheets') {
      return Promise.all([
        this.deleteSecret({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-databaseName`,
        }),
        this.deleteSecret({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-spreadsheetId`,
        }),
      ])
    }

    if (provider === 'BigQuery') {
      return this.deleteSecret({
        SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-credentials`,
      })
    }
  }

  async updateCredentialsByProvider({
    provider,
    dataSourceId,
    credentials,
  }: {
    dataSourceId: string
    provider: Engines
    credentials: any
  }) {
    if (provider === 'Sheets') {
      const [databaseName] = await Promise.all([
        this.getSecretValue({
          SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-databaseName`,
        }).catch(() => null),
      ])

      return Promise.all([
        databaseName
          ? this.updateSecret({
              SecretId: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-databaseName`,
              SecretString: credentials.databaseName,
            })
          : this.createSecret({
              Name: `${process.env.AWS_SSM_SECRET_PREFIX}-${dataSourceId}-databaseName`,
              SecretString: credentials.databaseName,
            }),
      ])
    }
  }

  async deleteSecret({ SecretId }: { SecretId: string }) {
    try {
      await secretManager.describeSecret({ SecretId }).promise()

      return await secretManager.deleteSecret({ SecretId }).promise()
    } catch (error) {
      throw new Error(`Error deleting secret: ${error.message}`)
    }
  }

  private async updateSecret({
    SecretId,
    SecretString,
  }: {
    SecretId: string
    SecretString: string
  }) {
    try {
      await secretManager.describeSecret({ SecretId }).promise()

      await secretManager
        .updateSecret({
          SecretId,
          SecretString: encrypt(SecretString),
        })
        .promise()
    } catch (error) {
      throw new Error(`Error updating secret: ${error.message}`)
    }
  }

  private async createSecret({
    Name,
    SecretString,
  }: {
    Name: string
    SecretString: string
  }) {
    try {
      const createSecretParams = {
        Name: Name,
        SecretString: encrypt(SecretString),
      }

      await secretManager.createSecret(createSecretParams).promise()
    } catch (error) {
      throw new Error(`Error creating secret: ${error.message}`)
    }
  }

  private async getSecretValue({ SecretId }: { SecretId: string }) {
    try {
      const secretValue = await secretManager
        .getSecretValue({ SecretId })
        .promise()

      return decrypt(secretValue.SecretString)
    } catch (error) {
      throw new Error(`Error retrieving secret value: ${error.message}`)
    }
  }
}
