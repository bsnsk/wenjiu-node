
module.exports = {
  check: (variable, standard) => {
    switch (standard) {
      case "int":
        return !isNaN(parseInt(variable));
      case "string":
        return !(variable === undefined) && variable.toString() == variable;
      case "not_null":
        if (variable === undefined)
          return 0;
        return 1;
      default:
        console.log({"typecheck": "unknown standard: " + standard});
        return 0;
    }
  },

  report: (res) => {
    res.send(JSON.stringify({
      "status": "failure",
      "message": "invalid argument"
    }));
  }
}
