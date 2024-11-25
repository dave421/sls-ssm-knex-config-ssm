import { Knex } from "knex";
import KnexHandler from "./KnexHandler";
import { getKnex } from "../knexfile";

export class MainHandler extends KnexHandler {
  constructor(knex: Knex) {
    super(knex);
  }

  handleRequest = async (request: Request): Promise<void> => {
    try {
      // your code here
    } catch (err: any) {
      if (err instanceof Error) throw err;

      throw new Error(err.message || "An error has occured", err.code || 400);
    }
  };
}

export const handler = new MainHandler(getKnex()).handler;
