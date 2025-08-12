addEventListener("load", async () => {
  if (location.protocol === "file:") {
    document.querySelector("i").innerText = (await (await fetch("https://zxmushroom63.github.io/synthetic-audio/LICENSE")).text()).trim();
  } else {
    document.querySelector("i").innerText = (await (await fetch("LICENSE")).text()).trim();
  }
});
