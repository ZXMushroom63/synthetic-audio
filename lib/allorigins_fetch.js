const corsFetch = function (...args) {
    args[0] = `https://api.allorigins.win/get?url=${encodeURIComponent(args[0])}`;
    return fetch.apply(this, args);
}