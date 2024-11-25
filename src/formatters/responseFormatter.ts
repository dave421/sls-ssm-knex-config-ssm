/**
 * Remove null properties from the response
 * @param json
 * @param label
 */
export const responseFormatter = function (json: { [key: string]: any }): any {
  if (!!json && Array.isArray(json)) {
    json.map((x: any) => {
      if (typeof x === "object" || Array.isArray(x))
        return responseFormatter(x);
      return x;
    });
  } else if (!!json && typeof json === "object") {
    Object.keys(json).forEach((x) => {
      if (json[x] === null) delete json[x];
      else if (typeof json[x] === "object" || Array.isArray(json[x]))
        responseFormatter(json[x]);
    });
  }
  return json;
};
