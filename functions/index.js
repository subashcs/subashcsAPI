var functions = require("firebase-functions");
var express = require("express");

var graphqlHTTP = require("express-graphql").graphqlHTTP;

var schema = require("./schema/schema");

var bodyParser = require("body-parser");

var mongoose = require("mongoose");

var jwt = require("express-jwt");
var path = require("path");
var app = express();
var User = require("./models/user");

var URLSearchParams = require("url").URLSearchParams;
global.URLSearchParams = URLSearchParams;

require("dotenv").config({ path: path.resolve(__dirname, ".env") }); // bodyparser

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var PORT = process.env.PORT; // authentication middleware

var authMiddleware = jwt({
  secret: process.env.JWT_SECRET || "ALDULXDFUAXDFDJSFLA",
  credentialsRequired: false,
  algorithms: ["RS256"],
});
app.use(authMiddleware);
mongoose.connect(process.env.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", function () {
  console.log("connected to database");
});
//This route will be used as an endpoint to interact with Graphql,
//All queries will go through this route.
app.get("/test", function (req, res) {
  res.status(200).json({
    success: true,
    data: "Hello",
  });
});
app.get("/test1", async function (req, res) {
  let users = await User.find({});
  res.status(200).json({ users });
});

app.use(
  "/",
  graphqlHTTP(function (req) {
    console.log("using graphql");
    return {
      //directing express-graphql to use this schema to map out the graph
      schema: schema,
      //directing express-graphql to use graphiql when goto '/graphql' address in the browser
      //which provides an interface to make GraphQl queries
      graphiql: true,
      context: {
        user: req.user,
      },
    };
  })
);

if (process.env.NODE_ENV === "development") {
  app.listen(PORT, function () {
    console.log("Listening on port ", PORT);
  });
}

// https://firebase.google.com/docs/functions/write-firebase-functions
exports.graphql = functions.https.onRequest(app);
