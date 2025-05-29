function viewHelp() {
  var div = document.createElement("div");
  div.innerHTML =
    `
(click to close)


******************
*    STARTING    *
******************
Once the program has started, you can LOAD projects using the 'Load' button. Supported formats are:
  -  .sm (SYNTHETIC music file)
  -  .mid (midi file)

You can add nodes (tracks, loops, assets and filters) using the 'Add Tracks' menu in the top right.
  |- Click to expand or shrink categories.

You can move tracks using the LEFT MOUSE BUTTON. Holding 'Ctrl' while doing this ignores the 'Substepping' option.
Dragging the handles on the left and right of nodes allows you to change the duration.
Right click on a node to edit it's properties.

Nodes are applied in order from top to bottom.

You can use different editor layers for different components of a song.

Negative layers to not output any sound into the mixer.
  |- They are useful for making procedural assets (using the save asset and play asset nodes)



******************
*      KEYS      *
******************
CTRL + / = View specific help text for element.
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
N = Open toolbox panel
RMB on timeline = select multiple nodes (select box)
SHIFT + LMB on timeline = select multiple nodes (select box)
ALT + RMB on timeline = select multiple nodes, temporarily switch tool to Multi-Edit
RMB on the visualiser = switch between waveform <-> EQ
SHIFT + A = add a new loop via search (hint: in search bar, try using shortcuts like ';lop' for a lowpass filter)
ALT + SCROLL = modify target value on respective loop (usually the note), and play preview if applicable
ALT + CLICK = play loop preview if applicable
CTRL + S = write to autosave slot
CTRL + SHIFT + S = save as file


*******************
* INPUT SHORTCUTS *
*******************
If an input box is purple, that means you can write inline scripts inside it.
For a simple linear interpolation, try inputting:   #0~24
For a exponential interpolation (squared), try inputting:   #0~24@2
  |- (spaces are allowed between the numbers)
For interpolating using a custom waveform, use #100~500@!custom_waveform_name
  |- You can cycle through the waveform at a frequency (eg: 2Hz) using #100~500@!custom_waveform_name!2

For writing arithmetic, do: #1*4

For writing an arbitrary script, do: #(()=>{/*/code/*/ return 1;})()
These scripts have access to the following variables:
x - The percentage through the node
rt - The total runtime of the node
i - The index of the current sample

In purple input boxes, you can also use autocomplete for notes.
:a:  =  :a4:  =  440
:g#3:  =  207

In any input box, pressing 'b' on your keyboard will round the frequency into the nearest note.
'o' will shift the frequency up 1 semitone,
'u' will shift down 1 semitone.
't' will convert beats into seconds

';' will turn a frequency into a note representation (440 -> :a4:)
''' evaluates any inline script at 0% (:a4: -> 440, #0.5~1 -> 0.5)

`.replaceAll(" ", "&nbsp;").replaceAll("\n", "\<br\>");
  div.style = "font-family: monospace; position: absolute; z-index: 99999; top: 0; left: 0; right: 0; bottom: 0; background-color: black; color: white; overflow-x: hidden; overflow-y: auto;";
  div.addEventListener("click", () => {
    div.remove();
  });
  document.body.appendChild(div);
}
const HELP_TEXT_DICT = {};
function registerHelp(selector, helpText) {
  var txt = ("(click to close)\n\n" + helpText).trim().replaceAll(" ", "&nbsp;").replaceAll("\n", "\<br\>");
  HELP_TEXT_DICT[selector] = txt;
}
addEventListener("keydown", (e) => {
  if (e.key === "/" && e.ctrlKey) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    var target = document.elementFromPoint(mouse.x, mouse.y);
    var help = Object.entries(HELP_TEXT_DICT).find(x => {
      if ((new Set(document.querySelectorAll(x[0]))).has(target)) {
        return true;
      }
    })?.[1];
    if (!help) {
      return;
    }
    var div = document.createElement("div");
    div.innerHTML = help;
    div.style = "font-family: monospace; position: absolute; z-index: 99999; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.85); color: white; overflow-x: hidden; overflow-y: auto;";
    div.addEventListener("click", () => {
      div.remove();
    });
    document.body.appendChild(div);
  }
});

registerHelp(".trayElem:has(#editorlayer), #editorlayer",
`
> EDITOR LAYER FIELD

Editor layer are ways to have different notes with different filters playing at the same type.
Layers 0-9 go into the volume mixer. They can be accessed using CTRL + 0, CTRL + 1, etc.
Layer 10 is a readonly layer where all loops are visible (for demos). It can be accessed with CTRL + SPACE
Negative layers can only be accessed using the number editor. Data does not go into the audio mixer, but assets are saved for future layers. It is primarily used for created loops/other assets that are used in layers 0-9.
`);

registerHelp(".trayElem:has(#bpm), #bpm",
`
> BPM FIELD

The BPM of your song. It controls the distribution of the white bars on the timeline.
`);

registerHelp(".trayElem:has(#loopi), #loopi",
`
> LOOP INTERVAL FIELD

The loop interval field can be changed to sizes such as 1, or 2 for songs that primarily use loops in order to make loops of durations like 5.9s round up to 6s.
`);

registerHelp(".trayElem:has(#duration), #duration",
`
> DURATION FIELD

The duration of the song in seconds.
`);

registerHelp(".trayElem:has(#stereobox), #stereobox",
`
> STEREO AUDIO FIELD

Whether or not to enable rendering different audio for each ear/side. Enabling this doubles render time.
`);

registerHelp(".trayElem:has(#normalisebox), #normalisebox",
`
> NORMALISE AUDIO FIELD

Should the volume of the audio be automatically controlled so that no audio is overdriven. Disable for more direct control over the volume of your song.
`);

registerHelp(".trayElem:has(#samplerate), #samplerate",
`
> SAMPLERATE FIELD

The quality of rendered audio. 48k is industry standard, but 24k is recommended for faster render times while editing.
`);

registerHelp(".trayElem:has(#nolod), #nolod",
`
> NO LOD FIELD

Whether or not to disable level of detail features based on song length. Disable or any remotely powerful device.
`);

registerHelp(".trayElem:has(#isolate), #isolate",
`
> ISOLATE LAYER FIELD

Whether or not to only forward the current layer into the mixer. Used for editing one layer of a song.
`);

registerHelp(".trayElem:has(#forceWv), #forceWv",
`
> FORCE WAVEFORM FIELD

Whether or not to show the waveform display on loops of any length.
`);

registerHelp(".trayElem:has(#encformat), #encformat",
`
> ENCODE FORMAT FIELD

The encoding of the audio when rendering. Usually, you'll want to use .wav for blazing fast encoding, and .mp3 for efficient file compression.
`);

registerHelp(".trayElem:has(#substepping), #substepping",
`
> SUBSTEPPING FIELD

The amount of extra snapping points between each beat.
`);

registerHelp("[data-tab=Timeline]",
`
> TIMELINE TAB

This tab is where all your songs structure and melody resides.
`);