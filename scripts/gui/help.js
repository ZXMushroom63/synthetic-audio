function viewHelp() {
    var div = document.createElement("div");
    div.innerHTML =
        `
(click to close)

******************
*    STARTING    *
******************
To start the program select any audio assets you want to use in the 'Select loops folder: ' input box.
If you don't have any audio files, just select any file at all.

Once the program has started, you can LOAD projects using the 'Load' button. Supported formats are:
  -  .sm (SYNTHETIC music file)
  -  .mid (midi file)

You can add nodes (tracks, loops, assets and filters) using the 'Add Tracks' menu in the top right.
  |- Click to expand or shrink categories.

You can move tracks using the LEFT MOUSE BUTTON.
Dragging the handles on the left and right of nodes allows you to change the duration.
Right click on a node to edit it's properties.

Nodes are applied in order from top to bottom.

You can use different editor layers for different components of a song.

Negative layers to not output any sound into the mixer.
  |- They are useful for making procedural assets (using the save asset and play asset nodes)

******************
*      KEYS      *
******************
CTRL + (any number) = Go to that layer
Spacebar =  Pause/Play playback
SHIFT + LEFT = Playback to second 0
CTRL + Scroll on timeline = Shrink/expand timeline
DELETE/BACKSPACE = Delete selected loops
DELETE/BACKSPACE + Click = Delete loop
SHIFT + D = Duplicate selected/hovered loop(s)
CTRL + C = Copy selected/hovered loop(s)
CTRL + V = Paste selected/hovered loop(s)
CTRL + X = Cut selected/hovered loop(s)
TAB = Focus next input (in edit panel)
CTRL + SPACE = Go to ALL layer (layer 10, readonly)


*******************
* INPUT SHORTCUTS *
*******************
If an input box is purple, that means you can write inline scripts inside it.
For a simple linear interpolation, try inputting:   #0~24
For a exponential interpolation (squared), try inputting:   #0~24@2
  |- (spaces are allowed between the numbers)

For writing an arbitrary script, do: #(()=>{/*/code/*/ return 1;})()
These scripts have access to the following variables:
x - The percentage through the node
rt - The total runtime of the node
i - The index of the current sample

In purple input boxes, you can also use autocomplete for notes.
:a:  =  :a4:  =  440
:g#3:  =  207

In any numberical input box, pressing 'b' on your keyboard will round the frequency into the nearest note.

`.replaceAll(" ", "&nbsp;").replaceAll("\n", "\<br\>");
    div.style = "font-family: monospace; position: absolute; z-index: 99999; top: 0; left: 0; right: 0; bottom: 0; background-color: black; color: white; overflow-x: hidden; overflow-y: auto;";
    div.addEventListener("click", () => {
        div.remove();
    });
    document.body.appendChild(div);
}