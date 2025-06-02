// HTML5 offloading library by ZXMushroom63
// Offload elements before doing heavy duty DOM manipulations to stop browsers from causing too many reflows.
// Eg: offload("#myContainer"); reflow("#myContainer"); 
// Nesting multiple functions that all reflow the same element is also supported
// Scroll positions are maintained
// querySelector() and querySelectorAll() are patched to scan offloaded elements too
const offloadedElements = {};
const offloadedFrags = [];
const offloadDepthMap = {};
const originalQuerySelector = document.querySelector;
const originalQuerySelectorAll = document.querySelectorAll;
document.querySelector = function (sel) {
    if (offloadedElements[sel]) {
        return offloadedElements[sel].self;
    }
    const docOut = originalQuerySelector.apply(document, [sel]);
    if (docOut) {
        return docOut;
    }
    for (const frag of offloadedFrags) {
        const res = frag.querySelector(sel);
        if (res) {
            return res;
        }
    }
}
document.querySelectorAll = function (sel) {
    const out = [...originalQuerySelectorAll.apply(document, [sel])];
    for (const frag of offloadedFrags) {
        const res = frag.querySelectorAll(sel);
        out.push(...res);
    }
    return out;
}
function offload(sel) {
    offloadDepthMap[sel] ||= 0;
    offloadDepthMap[sel]++;
    if (offloadDepthMap[sel] !== 1) {
        return;
    }
    
    const target = originalQuerySelector.apply(document, [sel]);
    if (!target) {
        return;
    }

    const fragment = document.createDocumentFragment();
    
    offloadedElements[sel] = {
        self: target,
        parent: target.parentElement,
        frag: fragment,
        scrollData: {
            scrollTop: target.parentElement.scrollTop,
            scrollLeft: target.parentElement.scrollLeft
        }
    };
    offloadedFrags.push(fragment);
    fragment.appendChild(target);
}
function reflow(sel) {
    offloadDepthMap[sel]--;
    if (offloadDepthMap[sel] !== 0) {
        return;
    }
    if (offloadedElements[sel]) {
        offloadedElements[sel].parent.appendChild(offloadedElements[sel].self);
        Object.assign(offloadedElements[sel].parent, offloadedElements[sel].scrollData); //restore scroll data with 1 assignment for one less reflow
        offloadedFrags.splice(offloadedFrags.indexOf(offloadedElements[sel].frag), 1);
        delete offloadedElements[sel];
    }
}