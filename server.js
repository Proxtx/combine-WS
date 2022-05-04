import { WebSocketServer } from "ws";

const jobIdLength = 5;

export class CombineHandler {
  wss;
  combineAwaiters = [];
  genModule;

  constructor(server, genModule) {
    this.wss = new WebSocketServer({ noServer: true });
    this.genModule = genModule;
    this.wss.on("connection", async (socket) => {
      for (let i of this.combineAwaiters) {
        try {
          await i(socket);
        } catch (e) {
          console.log("combine-ws error:", e);
        }
      }
    });

    server.on("upgrade", (request, socket, head) => {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit("connection", ws, request);
      });
    });
  }

  onCombine = (module, callback) => {
    this.combineAwaiters.push(async (socket) => {
      let connected = true;
      socket.on("close", () => {
        connected = false;
      });
      const id = randomString(jobIdLength);
      socket.send("combine-id" + id);
      let additionalInfo = { socket, id, connected: true };
      try {
        callback(
          await this.genModule(async (body) => {
            if (!connected) {
              additionalInfo.connected = connected;
              return { success: false, error: "disconnected", type: "ws" };
            }
            const jobId = randomString(jobIdLength);
            let resolve;
            let result;
            let resolved = false;
            socket.on("message", (m) => {
              m = m.toString();
              if (m.substring(0, 10 + jobIdLength) == "combine-ac" + jobId) {
                result = JSON.parse(m.substring(10 + jobIdLength));
                resolve();
              }
            });
            socket.send("combine-ts" + jobId + JSON.stringify(body));
            await new Promise(async (r) => {
              resolve = r;
              while (connected && !resolved) {
                await new Promise((r) => setTimeout(r, 5000));
              }
              result = { success: false, error: "disconnected", type: "ws" };
              additionalInfo.connected = connected;
              r();
            });
            resolved = true;
            return result;
          }, module),
          additionalInfo
        );
      } catch (e) {
        console.log("Combine ws error loading a module. Ignored", module);
      }
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
