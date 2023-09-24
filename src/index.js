import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import routes from "./routes.js";

const server = express();

server.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
server.use(bodyParser.json({ limit: "50mb" }));
server.use(cookieParser());
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("Server ready on port", port);
});

server.use(routes);
