function intersect(rect1, rect2) {
    return (
        rect1.left < rect2.right &&
        rect1.right > rect2.left &&
        rect1.top < rect2.bottom &&
        rect1.bottom > rect2.top
    );
}
addEventListener("init", () => {
    document.querySelector("#track").addEventListener("scroll", () => {
        if (document.querySelector(".selectbox")) {
            window.onmousemove(window.lastScrollEvent);
        }
    });
    document.querySelector("#trackInternal").addEventListener("mousedown", (e) => {
        if (e.button !== 2) {
            return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        var track = document.querySelector("#track");
        var initialScrollLeft = track.scrollLeft;
        var initialScrollTop = track.scrollTop;
        var a = { x: e.clientX, y: e.clientY };
        var b = { x: e.clientX, y: e.clientY };
        var selectBox = document.createElement("div");
        selectBox.classList.add("selectbox");
        selectBox.style.color = "red";
        selectBox.style.top = a.y + "px";
        selectBox.style.left = a.x + "px";
        selectBox.style.bottom = (window.innerHeight - b.y) + "px";
        selectBox.style.right = (window.innerWidth - b.x) + "px";
        document.querySelector("#trackInternal").appendChild(selectBox);
        window.oncontextmenu = (e) => { e.preventDefault() };
        window.onmousemove = function (e) {
            window.lastScrollEvent = e;
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            var scrollDx = track.scrollLeft - initialScrollLeft;
            var scrollDy = track.scrollTop - initialScrollTop;
            b.x = e.clientX;
            b.y = e.clientY;
            var pos1 = {
                x: Math.min(a.x - scrollDx, b.x),
                y: Math.min(a.y - scrollDy, b.y)
            }
            var pos2 = {
                x: Math.max(a.x - scrollDx, b.x),
                y: Math.max(a.y - scrollDy, b.y)
            }
            selectBox.style.top = pos1.y + "px";
            selectBox.style.left = pos1.x + "px";
            selectBox.style.bottom = (window.innerHeight - pos2.y) + "px";
            selectBox.style.right = (window.innerWidth - pos2.x) + "px";
        }
        window.onmouseup = function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            selectBox.remove();
            setTimeout(() => { window.oncontextmenu = null; }, 1 / 60);
            window.onmousemove = null;
            window.onmouseup = null;
            var scrollDx = track.scrollLeft - initialScrollLeft;
            var scrollDy = track.scrollTop - initialScrollTop;
            var pos1 = {
                x: Math.min(a.x - scrollDx, b.x),
                y: Math.min(a.y - scrollDy, b.y)
            }
            var pos2 = {
                x: Math.max(a.x - scrollDx, b.x),
                y: Math.max(a.y - scrollDy, b.y)
            }
            var rect = new DOMRect(pos1.x, pos1.y, pos2.x - pos1.x, pos2.y - pos1.y);
            document.querySelectorAll(".loopInternal").forEach(x => {
                var rect2 = x.getBoundingClientRect();
                if (intersect(rect, rect2)) {
                    ACTIVE_TOOL_FN(x.parentElement);
                }
            });
        }
    });
    document.querySelector("#trackInternal").addEventListener("contextmenu", (e) => { e.preventDefault() });
});