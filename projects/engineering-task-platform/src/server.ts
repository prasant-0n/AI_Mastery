import { createServer } from "node:http";

const server = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({
    service: "engineering-task-platform",
    status: "ok",
  }));
});

const port = Number(process.env.PORT ?? 3000);

server.listen(port, () => {
  console.log(`engineering-task-platform listening on :${port}`);
});
