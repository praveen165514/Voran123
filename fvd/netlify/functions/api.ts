import express from "express";
import serverless from "serverless-http";
import apiRouter from "../../src/apiRouter";

const api = express();

// Catch all possible path formats Netlify might pass
api.use("/api", apiRouter);
api.use("/.netlify/functions/api", apiRouter);
api.use("/", apiRouter);

// Catch-all to ensure the API never returns HTML error pages
api.use((req, res) => {
  res.status(404).json({ error: "API Route Not Found", path: req.path, url: req.url });
});

export const handler = serverless(api);
