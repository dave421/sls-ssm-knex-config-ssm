import BaseHandler from "./baseHandler";
import { Knex as KnexType } from "knex";
import { Model } from "objection";

export abstract class KnexHandler extends BaseHandler {
  constructor(knex: KnexType, isProduction = false) {
    super(isProduction);
    Model.knex(knex);
    try {
      Model.knex(knex);
    } catch (error) {
      console.log(error);
      const e: any = error;
      throw this.failed(new Error(JSON.stringify(e, null, 2)));
    }
  }
}

export default KnexHandler;
