const jobIdLength = 5;

export const serve = async (data, url) => {
  let w = new WebSocket(url);
  let id;
  let r;
  w.onmessage = async (ev) => {
    if (ev.data.substring(0, 10) == "combine-ts") {
      w.send(
        "combine-ac" +
          ev.data.substring(10, jobIdLength + 10) +
          JSON.stringify(
            await data(JSON.parse(ev.data.substring(10 + jobIdLength)))
          )
      );
    } else if (ev.data.substring(0, 10) == "combine-id") {
      id = ev.data.substring(10, jobIdLength + 10);
      r();
    }
  };
  await new Promise((resolve) => (r = resolve));
  return id;
};
