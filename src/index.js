const app = require("./lib/app");

app(document.getElementById("app")).catch(err => console.error(err));
