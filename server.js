import { WebSocket } from "@proxtx/websocket";

const jobIdLength = 5;

export class CombineHandler {
  ws;
  combineAwaiters = [];
  genModule;

  constructor(server, genModule) {
    this.genModule = genModule;
    this.ws = new WebSocket(server);
    this.ws.onConnect(async (socket) => {
      for (let i of this.combineAwaiters) {
        try {
          await i(socket);
        } catch (e) {
          console.log("combine-ws error:", e);
        }
      }
    });
  }

  onCombine = (module, callback) => {
    this.combineAwaiters.push(async (socket) => {
      const id = randomString(jobIdLength);
      socket.send("combine-id" + id);
      socket.id = id;
      callback(
        await this.genModule(async (body) => {
          const jobId = randomString(jobIdLength);
          let resolve;
          let result;
          socket.onMessage((m) => {
            if (m.substring(0, 10 + jobIdLength) == "combine-ac" + jobId) {
              result = JSON.parse(m.substring(10 + jobIdLength));
              resolve();
            }
          });
          socket.send("combine-ts" + jobId + JSON.stringify(body));
          await new Promise((r) => {
            resolve = r;
          });
          return result;
        }, module),
        socket
      );
    });
  };
}

let chars = "abcdefghijklmnopqrstuvwxyz".split("");
let randomString = (length) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[random(0, chars.length - 1)];
  }
  return result;
};

export const random = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
