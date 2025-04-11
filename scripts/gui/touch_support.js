let isTouching = false;

document.addEventListener("touchstart", (e) => {
    isTouching = true;
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent("mousedown", {
        bubbles: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: e.touches.length === 1 ? 0 : 2
    });
    touch.target.dispatchEvent(mouseEvent);
});

document.addEventListener("touchmove", (e) => {
    if (!isTouching) return;
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent("mousemove", {
        bubbles: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
    });
    touch.target.dispatchEvent(mouseEvent);
});

document.addEventListener("touchend", (e) => {
    isTouching = false;
    const touch = e.changedTouches[0];
    const mouseEvent = new MouseEvent("mouseup", {
        bubbles: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
    });
    touch.target.dispatchEvent(mouseEvent);
});