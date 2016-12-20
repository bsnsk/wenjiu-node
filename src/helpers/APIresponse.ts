export default class APIResponse {
  constructor (
    success: boolean,
    message: string,
    contents: Object = {}
  ){
    var obj: Object = {
      "status": success ? "success" : "failure",
      "message": message,
    }
    for (var key in contents){
      obj[key] = contents[key];
    }
    return obj;
  }
}
