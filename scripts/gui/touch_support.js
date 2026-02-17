let isTouching = false;
let lastTouchStart = { stamp: Date.now(), x: 0, y: 0 };
let touchRmbTimer = -1;
let longPressDuration = 350;
let rmbPressed = false;
function fireTouchRmb() {
    rmbPressed = true;
    lastTouchStart.target.dispatchEvent(new MouseEvent("mouseup", {
        bubbles: true,
        clientX: lastTouchStart.x,
        clientY: lastTouchStart.y,
        button: 0
    }));
    lastTouchStart.target.dispatchEvent(new MouseEvent("mousedown", {
        bubbles: true,
        clientX: lastTouchStart.x,
        clientY: lastTouchStart.y,
        button: 2
    }));
}
document.addEventListener("touchstart", (e) => {
    keymap["Control"] = e.touches.length === 2;
    webpageUsesTouch = true;
    isTouching = true;
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent("mousedown", {
        bubbles: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
    });

    touch.target.dispatchEvent(mouseEvent);
    if (mouseEvent.defaultPrevented || keymap["Control"]) {
        e.preventDefault();
    }
    lastTouchStart = Object.assign(e, { stamp: Date.now(), x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    lastTouchMove = Object.assign(e, { stamp: Date.now(), x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });

    touchRmbTimer = setTimeout(fireTouchRmb, longPressDuration);
});

let lastTouchMove = lastTouchStart;
document.addEventListener("touchmove", (e) => {
    keymap["Control"] = e.touches.length === 2;
    const distanceMoved = Math.sqrt(Math.pow(lastTouchStart.x - e.targetTouches[0].clientX, 2) + Math.pow(lastTouchStart.y - e.targetTouches[0].clientY, 2));
    if (distanceMoved < 2) {
        return;
    } else {
        clearTimeout(touchRmbTimer);
    }

    if (!isTouching) return;

    const touch = e.changedTouches[0];

    if (keymap["Control"]) {
        e.preventDefault();
        touch.target.dispatchEvent(new WheelEvent("wheel", {
            bubbles: true,
            deltaY: (lastTouchMove.y - e.targetTouches[0].clientY),
            deltaMode: 0x00
        }));
    } else {

        const mouseEvent = new MouseEvent("mousemove", {
            bubbles: true,
            clientX: touch.clientX,
            clientY: touch.clientY,
        });
        touch.target.dispatchEvent(mouseEvent);
        if (mouseEvent.defaultPrevented || rmbPressed) {
            e.preventDefault();
        }
    }

    lastTouchMove = Object.assign(e, { stamp: Date.now(), x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
}, { passive: false });

let lastTouchEnd = lastTouchStart;
document.addEventListener("touchend", (e) => {
    keymap["Control"] = e.touches.length === 2;
    if (rmbPressed) {
        lastTouchStart.target.dispatchEvent(new MouseEvent("mouseup", {
            bubbles: false,
            clientX: lastTouchStart.x,
            clientY: lastTouchStart.y,
            button: 2
        }));
        rmbPressed = false;
    }
    clearTimeout(touchRmbTimer);
    isTouching = false;
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent("mouseup", {
        bubbles: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
    });
    touch.target.dispatchEvent(mouseEvent);
    lastTouchEnd = Object.assign(e, { stamp: Date.now() });
});