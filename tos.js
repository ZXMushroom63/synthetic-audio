addEventListener("load", async () => {
  if (location.pathname.includes("terms_of_use.html")) {
    if (location.protocol === "file:") {
      document.querySelector("i").innerText = (await (await fetch("https://zxmushroom63.github.io/synthetic-audio/LICENSE")).text()).trim();
    } else {
      document.querySelector("i").innerText = (await (await fetch("LICENSE")).text()).trim();
    }
  }
  document.querySelector("#back").addEventListener("click", (e)=>{e.preventDefault();history.back();});
});
