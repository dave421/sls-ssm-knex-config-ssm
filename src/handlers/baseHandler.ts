import { Context } from "aws-lambda";
import { responseFormatter } from "../formatters/responseFormatter";
import { JSONSchema } from "objection";

export default abstract class BaseHandler {
  constructor(protected isProduction: boolean = true) {
    // tumbleweed
  }

  jsonSchema: JSONSchema | null = null;

  handler = async (req: any, ctx: Context): Promise<void> => {
    try {
      const resp = await this.handleRequest(req, ctx);
      const responseJson = responseFormatter(resp);

      JSON.stringify(responseJson);
    } catch (err) {
      await this.errorHandler(err);
    }
  };

  failed = (err: Error): string => JSON.stringify(err);

  protected async errorHandler(err: Error): Promise<void> {
    console.error(JSON.stringify(err, null, 2));
  }

  protected abstract handleRequest(req: unknown, ctx: Context): Promise<any>;
}
