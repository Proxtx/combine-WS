import { WebSocket } from "@proxtx/websocket";

export class CombineHandler {
  ws;
  combineAwaiters = [];
  genModule;
  jobIdLength = 5;

  constructor(server, genModule) {
    this.genModule = genModule;
    this.ws = new WebSocket(server);
  }

  onCombine = (module, callback) => {
    this.combineAwaiters.push((socket) => {
      callback(
        this.genModule(async (body) => {
          const jobId = randomString(this.jobIdLength);
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
        }, module)
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
