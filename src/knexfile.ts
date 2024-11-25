import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import Knex, { Knex as KnexType } from "knex";
import { IDatabaseSecret } from "./contracts/IDatabaseSecret";
import { IUserSecret } from "./contracts/IUserSecret";

class KnexBuilder {
  private _paths: Record<string, string> = {
    database: "mysql/[[env]]/user-[[user]]",
    user: "mysql/[[env]]/active-user",
  };
  private _config: { [key: string]: any };
  private _secrets: IDatabaseSecret;
  private _activeUser: IUserSecret;

  constructor(
    private _client: SecretsManagerClient,
    private _database: string
  ) {
    this._secrets = {} as IDatabaseSecret;
    this._activeUser = {} as IUserSecret;
    this._config = {};
  }

  /**
   * Get config
   * @param env
   * @param attempts
   * @returns
   * @throws ApiError
   * @throws Error
   */
  public getConfig = async (env: string, attempts = 5) => {
    await this.setSecrets(env);
    this.setConfig(env);
    for (let loop = 1; loop <= attempts; loop++)
      try {
        const connected = await this.testConnection();
        if (!!connected) return this._config;
      } catch (error: any) {
        if (loop === attempts)
          throw new Error(
            error.message ?? `error, no db connection (attempt: ${loop})`
          ); // Throw error on last attempt
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, loop) * 1000)
        ); // Exponential backoff
      }
  };

  /**
   * Test connection
   * @param env
   * @returns
   */
  private testConnection = async (): Promise<boolean> => {
    // test the connection
    const conn = Knex({
      client: "mysql",
      connection: this._config,
      debug: true,
    });
    await conn.raw("SELECT 1+1 as result"); // Successful connection
    // close the connection
    await conn.destroy();
    return true;
  };

  /**
   * Set config
   * @param env
   */
  private setConfig = (env: string): void => {
    this._config = {
      host: this._secrets.proxy,
      user: this._secrets.username,
      password: this._secrets.password,
      database: env !== "prod" ? `${env}-${this._database}` : this._database,
      port: 3306,
    };
  };

  /**
   * Configure secrets
   * @param env
   * @throws Error
   */
  private setSecrets = async (env: string): Promise<void> => {
    try {
      const activeUserSecret = await this.getSecrets(env, "user");
      let oneOrTwo = activeUserSecret.activeUser;
      const oneAndAHalfHoursAgo = new Date().getTime() - 5400000; // 1.5 hours in milliseconds

      // check the timestamp of the active user secret, if it's less than 1.5 hours old use the opposite user to allow Lambda/proxy cache to update
      if (activeUserSecret.timestamp > oneAndAHalfHoursAgo)
        oneOrTwo = oneOrTwo === "one" ? "two" : "one";

      this._secrets = await this.getSecrets(env, "database", oneOrTwo);
    } catch (error: any) {
      throw new Error(`Error fetching secrets: ${error.message ?? error}`);
    }
  };

  /**
   * Get secrets from AWS Secrets Manager
   * For a list of exceptions thrown, see https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
   * @param env
   * @param type
   * @param activeUser
   * @returns
   */
  private getSecrets = async (
    env: string,
    type: string,
    activeUser = "one"
  ): Promise<any> => {
    const SecretId = this.getPath(type, env, activeUser);
    try {
      const response = await this._client.send(
        new GetSecretValueCommand({ SecretId })
      );
      return JSON.parse(<string>response.SecretString);
    } catch (error) {
      throw { SecretId, error };
    }
  };

  /**
   * Dynamically build the path to the secret
   * @param type
   * @param env
   * @param activeUser
   * @returns
   */
  private getPath = (type: string, env: string, activeUser?: string): string =>
    type === "database"
      ? this._paths[type]
          .replace("[[env]]", env)
          .replace("[[user]]", <string>activeUser)
      : this._paths[type].replace("[[env]]", env);
}

const getKnexConfig = (env: string): KnexType.Config => ({
  client: "mysql",
  debug: true,
  pool: { min: 0, max: 10 },
  connection: async (): Promise<any> => {
    const knexBuilder = new KnexBuilder(
      new SecretsManagerClient({ region: "eu-west-2" }),
      "core"
    );
    return await knexBuilder.getConfig(env);
  },
});

export default getKnexConfig(process.env.ENV || "dev");

const connection = Knex(getKnexConfig(process.env.ENV || "dev"));
export const getKnex = (): KnexType => connection;
