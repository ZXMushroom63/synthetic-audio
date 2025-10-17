const helpContent = new ModMenuMarkedTabList();

helpContent.addTab("Getting Started", `
Once the program has started, you can load projects using the 'Load' button. Supported formats are:
  -  .sm (SYNTHETIC music file)
  -  .mid (midi file, converted to .sm)

You can add nodes (tracks, loops, assets and filters) using the 'Add Tracks' menu in the top right, or using the Shift+A add menu.
  - Click to expand or shrink categories in the 'Add Tracks' menu
  - Press the ~Render Audio~ button to update the audio.


You can move tracks using the LEFT MOUSE BUTTON.
  - Holding 'Ctrl' while doing this ignores the 'Substepping' option, and snaps to the nearest beat.
  - Holding 'Shift' ignores all snapping and moves directly to the mouse's location.

Dragging the handles on the left and right of nodes allows you to change it's duration.
  - 'Ctrl' and 'Shift' have the same effect
  - 'Alt' will resize the whole chord / node stack

You can right click on a node to edit its properties.

Nodes are applied in order from top to bottom.
For example, if you were to add an 'Advanced Synth' on top of a bitcrunch filter like this, only the end of the synth would be processed.
<br>
<img src="public/tutorial/order.png"></img>
<br>

You can use different 'editor layers' for different components of a song. The current editor layer is controlled by the 'Editor Layer' input box in the bottom left of the editor.

Negative layers to not output any sound into the mixer, unless 'Isolate layer' is enabled. This makes them useful for experimenting, as well as creating procedural assets using the 'Save Asset' and 'Play Asset' nodes.

Layers are processed in order from the lowest to the highest. As such, a procedural asset defined on layer 7 may not work on layer 1.
`);

helpContent.addTab("Keybinds", `
- ~CTRL + /~ = View specific help text for element.
- ~CTRL + (any number)~ = Go to that layer
- ~Spacebar~ =  Pause/Play playback
- ~SHIFT + LEFT~ = Playback to second 0
- ~CTRL + Scroll on timeline~ = Shrink/expand timeline
- ~DELETE/BACKSPACE~ = Delete selected loops
- ~DELETE/BACKSPACE + Click~ = Delete loop
- ~SHIFT + D~ = Duplicate selected/hovered loop(s)
- ~CTRL + C~ = Copy selected/hovered loop(s)
- ~CTRL + V~ = Paste selected/hovered loop(s)
- ~CTRL + X~ = Cut selected/hovered loop(s)
- ~TAB~ = Focus next input (in edit panel)
- ~CTRL + SPACE~ = Go to ALL layer (layer 10, readonly)
- ~N~ = Open toolbox panel
- ~RMB on timeline~ = select multiple nodes (select box)
- ~RMB on a node~ = edit properties of node
- ~SHIFT + LMB on timeline~ = select multiple nodes (select box)
- ~ALT + RMB on timeline~ = select multiple nodes, temporarily switch tool to Multi-Edit
- ~RMB on the visualiser~ = switch between waveform <-> EQ
- ~SHIFT + A~ = add a new loop via search (hint: in search bar, try using shortcuts like ~;lop~ for a lowpass filter)
- ~ALT + SCROLL~ = modify target value on respective loop (usually the note), and play preview if applicable
- ~ALT + M~ = if microtonality is enabled, toggle ~ALT + SCROLL~ between note and microtone modes
- ~ALT + CLICK~ = play loop preview if applicable
- ~CTRL + S ~= write to autosave slot
- ~CTRL + SHIFT + S~ = save as file
- ~CTRL + E~ = Export selected loops
- ~CTRL + Q~ = Multi-edit selected loops
- ~ALT + A~ = Arpeggiate selected loops
- ~F2~ = Rename selected loops
- ~CTRL + P~ = Convert selected loops into sheet music
- ~SHIFT + H~ = Open developer logs
- ~ALT + ;~ = Selected nodes will be bumped down by a fifth.
- ~ALT + '~ = Selected nodes will be bumped up by a fifth.
- ~ALT + [~ = Selected nodes will be bumped down by an octave.
- ~ALT + ]~ = Selected nodes will be bumped up by an octave.
- ~ALT + ,~ = Selected nodes will be bumped down by a semitone.
- ~ALT + .~ = Selected nodes will be bumped up by a semitone.
- ~PageDown~ = Selected nodes will be squashed to half the space
- ~PageUp~ = Selected nodes will be expanded to double the space
- ~PageDown~ = Hovered node will be shrunk by 1 substep
- ~PageUp~ = Hovered node will be expanded by 1 substep
- ~CTRL + B~ = Split selected node at playhead
- ~ALT + 2~ = Split selected node in two
- ~ALT + 3~ = Split selected node in three
- ~ALT + 4~ = Split selected node in four
- <code>&#126;</code> = while hovering over a node = See potential chord progression options + inversions
- <code>&#96;</code> = while hovering over a node = See potential chord inversions, on right side
- ~TAB~ = on bottom note of chord, open chord editor
- ~1~ = Checker deselect selected nodes
- ~2~ = Turn a chord into an arpeggio
- ~3~ = Turn an arpeggio into a chord
- ~4~ = Reverse the order of selected nodes
`);

helpContent.addTab("Programmable Fields", `
If an input box in a node is purple, that means you can write inline scripts inside it.
Scripts are denoted with a ~#~ at the start of the input.

- For a simple linear interpolation, try inputting:   ~#0~24~
- For a exponential interpolation (squared), try inputting:   ~#0~24@2~
- For interpolating using a custom waveform, use ~#100~500@!custom_waveform_name~
  - You can cycle through the waveform at a frequency (eg: 2Hz) using ~#100~500@!custom_waveform_name!2~
  - You can cycle at a specified duration per cycle in seconds (eg: 4s) using ~#0~2@!wvform!4s~
  - You can cycle at a specified duration per cycle in beats (eg: every 1/2 beat) using ~#0~2@!wvform!0.5b~
- For writing arithmetic, do: ~#1*4~ (requires untrusted scripts enabled in settings, in the misc tab)

For writing an arbitrary script, do: ~#(()=>{/*/code/*/ return 1;})()~ (requires untrusted scripts enabled in settings, in the misc tab)
These scripts have access to the following variables:
- ~x~ - The percentage through the node
- ~rt~ - The total runtime of the node
- ~i~ - The index of the current sample

You can also bind programmable inputs to 'Automation Parameters', a type of node that lets you create and configure settings for synths and complex filter stacks.
Create an 'Automation Parameter' node, and name it. You can bind using:
- ~@MyParam~ - Directly binds the value
- ~@MyParam!0~5~ - Binds the value, and maps from 0-1 to the specified range

Much like Automation Parameters, the LFO engine has built-in support for per-chord randomisation, with this syntax:
- ~&RANDOMID~ (random between 0.0 and 1.0)
- ~&MYRAND!-2~5~ (random between -2.0 and 5.0)
- ~&anything!0~12~12~ (random between 0.0 and 12.0, spacing each random value out by 12. Effectively, randomly pick 0 or 12)
- ~&Name!-2~5@2~ (random between -2.0 and 5.0, exponent of 2)
- ~&&PerNote!0~1~ (random between 0.0 and 1.0 for each individual note in the chord)
Different random ids (part directly after ~&~)

In purple input boxes, you can also use autocomplete for notes.
- ~:a:~  =  ~:a4:~  =  ~440~
- ~:g#3:~  =  ~207~

In any input box, pressing...
- ~b~ will round the frequency into the nearest note.
- ~o~ will shift the frequency up 1 semitone,
- ~u~ will shift down 1 semitone.
- ~t~ will convert beats into seconds

In programmable input boxes, pressing...
- ~;~ will turn a frequency into a note representation ( ~440~ -> ~:a4:~ )
- ~'~ evaluates any inline script at 0% ( ~:a4:~ -> ~440~ , ~#0.5~1~ -> ~0.5~ )
`);
helpContent.addTab("Custom Waveforms",
  `
<img src="public/tutorial/wv.png" width=350><br>
This tab is where custom waveforms or LFOs are designed.

You can create waveforms using the ~New~ button.

- Waveforms in the project are listed on the left. You can click on on a waveform to start editing it.
- In the middle of the UI, there is a canvas for drawing waveforms.
  - The grey line is a constant midpoint where the value is equal to 0.
  - The orange line is the midpoint of the calculated waveform.
  - The cyan line is the raw data of the waveform.
  - The lime green line is the calculated data of the waveform, with all modifiers applied. If there are no modifiers, it overlaps the cyan line.
- Scrolling down past the canvas, there is a panel for interacting with the waveform.
  - Frequency & volume controls for previewing the waveform.
  - An image reference for cloning waveforms
  - Write from visualiser
    - Loads sample data from the visualiser
    - Smart - Loads data and searches for periodic samples, and loads those in.
    - Copy - Converts the waveform to text and stores it on your clipboard
    - Paste - Loads a waveform from your clipboard.
- On the right, you can add 'modifiers'
  - For example, a smooth modifier gets rid of sharp edges.
`
);
helpContent.addTab("Plugins", `
This tab is where external resources are managed. This includes:
 - Plugins that add nodes
 - Pure-data patches compiled with ~hvcc~
 - Soundfonts  
 - Arp Patterns
 - Sample Packs
 - Individual samples (usually inserted via drag-and-drop)
 - Extra tools in editor

The type of an installed plugin is indicated by the emoji on the filename's left.
 - ~[🇯‌🇸‌]~ indicates a generic plugin
 - ~[🎛️]~ indicates a pure-data patch
 - ~[🎸]~ indicates a soundfont
 - ~[🔊]~ or ~[🎞️]~ indicates a sample
 - ~[🔨]~ indicates a tool
 - ~[📦]~ indicates a samplepack


### Compiling and created patches with pure-data/plugdata
> Prerequisites: Install emsdk (https://emscripten.org/docs/getting_started/downloads.html)

Synthetic Audio supports using pure data/plugdata patches compiled with the heavy compiler collection (maintained by Wasted Audio, https://github.com/Wasted-Audio/hvcc).
Specifically, until further notice, you must use my fork which adds various features and fixes for the web compile target: https://github.com/ZXMushroom63/hvcc
Clone the repository, move into the \`hvcc/\` directory, and run \`pip3 install -e .\`

Make a patch (I recommend plugdata for the editor), and save it to a file. While creating your patch, I'd recommend enabling 'compiled mode' to disable features that are not supported by hvcc.
When you are done, go to the folder containing the patch, and run \`hvcc mypatch.pd -g js\`

Open SYNTHETIC's plugins tab, and press ~Upload hvcc (.js)~ . Go to the folder containing your patches, open the \`js/\` directory, and select BOTH .js files. SYNTHETIC will patch them to add offline support as well as editor integration. On reloading SYNTHETIC you will be able to find the patch available as a filter when using the ~Shift + A~ shortcut or in the Plugins category in the add menu.


Making different types of input:
SYNTHETIC offers an extension to the default ~@hv_param~ inputs. Providing a default value of ~440~ in a receive object will make the parameter apepar as ~:A4:~ in the editor.
~[r NoteInput @hv_param 0 1000 440]~
Note that receivers will all be updated at once, so try only triggering updates from one receiver.

You can also create dropdowns, that return the index of the selected element, using a double underscore ( ~__~ ) to seperate the name and options of the dropdown, and a single underscore ( ~_~ ) to seperate the options.
~[r MyDropdown__firstoption_secondoption_thirdoption @hv_param 0 2 0]~

You can load audio samples into by creating a table or an array with a ~@hv_table~ suffix. This will let users select any procedural audio assets from a dropdown.
~[table mysamples 100 @hv_table]~
When a table is filled, you can get it's size using ~[r tlen_mysamples @hv_param 0 99999999 0]~

As always, samplerate can be found using:\\
~[loadbang]~ \\
  ~|~ \\
~[samplerate]~


### JavaScript API
(note: the best way to learn the API structure is to dig through the ~scripts/backend/filters/~ folder)
<pre>
${`
addBlockType("node_type_id", {
  title: "My Cool Node",
  color: "rgba(0, 255, 0, 0.3)", //background color
  wet_and_dry_knobs: false, //add builtin wet and dry knobs
  amplitude_smoothing_knob: false, //add amplitude smoothing knob
  isPlugin: true, //should it be in the plugins category (usually keep as true)
  configs: {
    "Text": ["hello world", "text"],
    "RegularNumber": [0.25, "number"],
    "ProgrammableNumber": [0.28, "number", 1],
    "Bool": [false, "checkbox"],
    "Dropdown": ["Default", ["Default", "Opt1", "Opt2", "Opt3"]]
  },
  functor: function(inPcm, channel, data) { //lambdas not supported. processes pcm signal data in the form of Float32Arrays. can be async
    return inPcm.map(x => x*0.5);
  },

  //OPTIONAL PARAMS:
  zscroll: (loop, value)=>{
    // zscrolling is the term for the value scrolling from holding down alt and using the scroll wheel.
    // function to modify the node on a zscroll. usually transposing the node up or down a semitone (value is an integer offset)
  }, 
  pitchZscroller: false, // does the node change in pitch when z-scrolling
  directRefs: ["mn"], // in the Shift+A add menu, this is an array shortcut aliases. in this example, typing ;mn would autocomplete to the node
  midiMappings: { // Object to map midi features into nodes. also used by the synth converter. the 'zero' array is a list of config entries that should be set to 0 when converting from midi/a different synth
    note: "Note",
    velocity: "Volume",
    zero: []
  },
  selectMiddleware: (key) => { //function to override the output of dropdown inputs. this demo shows how to add an asset input.
    if (key === "Dropdown") {
      var assetNames = [...new Set(Array.prototype.flatMap.apply(
        findLoops(".loop[data-type=p_writeasset]"),
        [(node) => node.conf.Asset]
      ))];
      return ["(none)", ...assetNames];
    }
  },
  assetUser: true, //if the node uses assets, set this flag to make sure the cache system recognises it
  assetUserKeys: ["Dropdown"], //the property names that reference/use assets. also part of the cache system
  
  creditURL: "https://github.com/ZXMushroom63", //url to credit the creator of a filter/synth
  
  dropdowns: {
    "Cool Dropdown": ["Text", "RegularNumber"] //object to allow you to visually group properties
  }
});


// NOTE FOR RANDOMNESS, Math.random() is patched and seeded. reseed every time functor is called
// const seed = 2;
// Math.newRandom(seed);
// Math.random()
`.replaceAll(" ", "&nbsp").replaceAll("\n", "<br>")}
</pre>

`);
helpContent.addTab("Soundfonts", `
To use instruments such as piano, guitar, etc, you need to install Soundfonts in the plugins tab.
SYNTHETIC uses the MIDI.js soundfont format, as well as more recent and slightly unstable support for the standardised .sf2 format.

- In the plugins tab, SYNTHETIC by default has buttons to download the FluidR3-GM and MusyngKite soundfonts, converted to MIDI.js by [@gleitz on GitHub](http://github.com/gleitz).
- Once the soundfonts have finished downloading, restart the editor. 
- You can access the soundfonts in editor using an ~Instrument~ node.
- In the ~Instrument~'s options menu, you can select your desired instrument.

- For .sf2 soundfonts, upload them in the Plugins tab
- Once uploaded, restart the editor
- Then, add a SoundFont2 node in the timeline to access the soundfonts
`);
helpContent.addTab("Samplepacks", `
### Adding samplepacks
- Download a sample pack from your favourite website 
- In the Plugins tab, press ~Upload sample pack (.zip)~
- The samplepacks will load on the next start of the editor
- You can delete the copy of the samplepack that you downloaded, it is now stored on the editor.


### Using samplepacks
- After restarting the editor, you can view samplepacks by pressing ~Shift + S~
- If your samplepack does not appear, try closing and reopening the samplepack menu. Samplepacks are lazy-loaded to improve startup times.
- In the samplepack menu, click on your samplepack to open it.
- This will switch to the 'Tree View' at the top of the samplepacks menu.
- Click on your added sample to add it to the timeline. (click to pickup, click to drop)


### Importing samples
- To add samples, try drag-and-dropping a sample file into the timeline.
- You can access imported samples in the 'User' samplepack, or from the 'Samples' category in the 'Add Tracks' menu in the top right.
`);
helpContent.addTab("Live Mode", `
### Live Mode
If you are lucky enough to own an audio interface, SYNTHETIC instances hosted on websites can be used to process incoming signals through the 'Live' tab.
To start:
- Press 'Request Perms' to enable microphone/audio input permissions.
- In the dropdown, select the desired port of your audio interface
- In your operating systems audio mixer, choose your audio interface as the output device.
- Press 'Start Input'
- To stop, press 'Stop Input'

On the right side, some built-in filters like delay and a basic reverb are available.
On the left, you can use the filter module buttons to add filters to the stack column in the centre.
You can right click added modules to configure them.
Just remember to be careful to not accidentally destroy your ear drums.
`);
helpContent.addTab("Misc Tab", "(coming soon)");
helpContent.addTab("Multiplayer", "(coming soon)");
helpContent.addTab("ToS", 
`
[Terms of Use](terms_of_use.html)
[Privacy Policy](privacy_policy.html)
`
);




const helpMenu = new ModMenu("Help", helpContent, "mod_help", syntheticMenuStyles);
function viewHelp() {
  helpMenu.init();
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