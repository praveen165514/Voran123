import express from "express";
import serverless from "serverless-http";
import apiRouter from "../src/apiRouter";

const app = express();
app.use("/api", apiRouter);

export default serverless(app);
