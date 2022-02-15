export const serve = async (data, url) => {
  let w = new WebSocket(url);
  w.onmessage(async (ev) => {
    if (ev.data.substring(0, 10) == "combine-ts") {
      w.send(
        "combine-ac" +
          ev.data.substring(10, jobIdLength + 10) +
          JSON.stringify(
            await data(JSON.parse(ev.data.substring(10 + jobIdLength)))
          )
      );
    }
  });
};
