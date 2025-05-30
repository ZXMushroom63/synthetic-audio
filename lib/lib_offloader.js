const offloadedElements = {};
const offloadedFrags = [];
const originalQuerySelector = document.querySelector;
const originalQuerySelectorAll = document.querySelectorAll;
document.querySelector = function (sel) {
    if (offloadedElements[sel]) {
        return offloadedElements[sel].self;
    }
    const all = [document, ...offloadedFrags];
    for (const dom of all) {
        const res = originalQuerySelector.apply(dom, [sel]);
        if (res) {
            return res;
        }
    }
}
document.querySelectorAll = function (sel) {
    const all = [document, ...offloadedFrags];
    const out = [];
    for (const dom of all) {
        const res = originalQuerySelectorAll.apply(dom, [sel]);
        out.push(...res);
    }
    return out;
}
function offload(sel) {
    const fragment = document.createDocumentFragment();
    const target = document.querySelector(sel);
    offloadedElements[sel] = {
        self: target,
        parent: target.parentElement,
        frag: fragment
    };
    offloadedFrags.push(fragment);
    fragment.appendChild(target);
}
function reflow(sel) {
    if (offloadedElements[sel]) {
        offloadedElements[sel].parent.appendChild(offloadedElements[sel].self);
        offloadedFrags.splice(offloadedFrags.indexOf(offloadedElements[sel].frag), 1);
        delete offloadedElements[sel];
    }
}