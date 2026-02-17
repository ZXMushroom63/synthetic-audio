addEventListener("init", ()=>{
    document.querySelector("#encformat").addEventListener("input", (e) => {
        if (audio.format !== e.target.value) {
            audio.format = e.target.value;
        }
    });
});
const codec_registry = {

};
function registerEncodingFormat(codec, extension, description, mime, basic) {
    codec_registry[extension] = {
        codec: codec,
        extension: extension,
        description: description,
        basic: !!basic,
        mime: mime
    };
    addEventListener("init", ()=>{
        document.querySelector("#encformat").innerHTML += `<option value="${extension}"${basic ? " selected" : ""}>.${extension} ${description}</option>`;
    });
}
registerEncodingFormat(()=>[], "wav", "(fast, larger, lossless)", "audio/wav", true);