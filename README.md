<img src="assets/brand/logo-1200.png" alt="CLIsnap" width="400">

# Terminal screenshots that actually look like your terminal

[![Version](https://img.shields.io/github/v/release/Arelius-D/CLIsnap?label=version&color=blue)](https://github.com/Arelius-D/CLIsnap/releases) [![Marketplace installs](https://vsmarketplacebadges.dev/installs/arelius-d.clisnap.svg?label=marketplace%20installs&color=007ACC)](https://marketplace.visualstudio.com/items?itemName=arelius-d.clisnap) [![License](https://img.shields.io/github/license/Arelius-D/CLIsnap?color=blue)](https://github.com/Arelius-D/CLIsnap/blob/main/LICENSE) [![VS Code](https://img.shields.io/badge/VS_Code-1.93%2B-%23007ACC.svg?logo=visualstudiocode&logoColor=white)](#requirements) [![Formats](https://img.shields.io/badge/Formats-SVG_%7C_PNG_%7C_HTML-blueviolet.svg)](#output-formats) [![Deps](https://img.shields.io/badge/Dependencies-none-brightgreen.svg)](#footprint) [![Network](https://img.shields.io/badge/Network_access-none-brightgreen.svg)](#footprint)

Select output in the VS Code terminal, run one command, get an SVG, HTML or PNG.

**By default you get exactly what you were looking at.** Your theme's colors, your terminal's font, your operating system's window frame. CLIsnap does not ship a single palette or font of its own, so nothing is invented and nothing needs configuring. Everything past that point is yours to change: any window frame, any size, and any theme you have installed, whether or not your IDE is currently using it.

<img src="assets/screenshots/vscode-dark-windows-frame.png" alt="A capture rendered with the VS Code Dark theme and a Windows window frame" width="230"> <img src="assets/screenshots/catppuccin-macchiato-macos-frame.png" alt="The same capture rendered with the Catppuccin Macchiato theme and a macOS window frame" width="230">

The same capture twice. On the left, VS Code Dark with a Windows frame. On the right, Catppuccin Macchiato with a macOS frame. Neither is a CLIsnap theme; both are themes already installed in the IDE.

## Install

Search for **CLIsnap** in the Extensions view and click Install.

See [CHANGELOG.md](CHANGELOG.md).

## Capture and save

This is the everyday path. One command, one dialog, done.

1. Select the output you want in the integrated terminal.
2. Press **`Ctrl+Shift+P`** (**`⌘⇧P`** on macOS) and run **CLIsnap: Capture and Save**.
3. Pick where to save it.

## Give it a shortcut

CLIsnap ships without one, on purpose (after several attempts to unify the shortcuts). Every combination worth having is already taken by the IDE, the terminal or the desktop, and which ones are free differs between machines. Yours is the only keyboard that matters, so pick the key yourself:

1. Press **`Ctrl+K Ctrl+S`** (**`⌘K ⌘S`** on macOS) to open Keyboard Shortcuts.
2. Search for **CLIsnap**. All three commands are listed.
3. Click the one you want, press your key, and press Enter.

VS Code tells you if the key already does something else, so you find out before it costs you a shortcut you rely on rather than after.

> [!NOTE]
> With Settings Sync turned on in VS Code, the shortcut you set follows you to your other machines, including ones running a different operating system.

## Capture and adjust

When you want a different theme, font or frame on a particular shot:

1. Select the output.
2. Press **`Ctrl+Shift+P`** (**`⌘⇧P`** on macOS) and run **CLIsnap: Capture and Preview**.
3. Change the theme, font, window frame, text size, line height or padding and watch the preview update.
4. Save as SVG, PNG or HTML, or copy the plain text.

Whatever you change here is remembered, so your next capture uses it. **Reset** puts everything back to how the capture was taken.

## Capturing long output

Scroll back and select as far as you want. CLIsnap captures the whole selection, not only the part on screen.

> [!IMPORTANT]
> The limit is your terminal's own scrollback, not CLIsnap. VS Code keeps 1000 lines by default, and anything older is already gone before you can select it. If you capture long logs, raise `terminal.integrated.scrollback`.

## Rendering a file

Some output is too long to select. A terminal only keeps the last 1000 lines by default, so anything older is gone before you can reach it. Send it to a file instead, and render the file.

1. Run your command, pointing its output at a file. Any command, any shell:

   ``` shell
   git log --oneline --graph -n 5000 > history.log
   ```

2. In VS Code, press **`Ctrl+Shift+P`** (**`⌘⇧P`** on macOS) and run **CLIsnap: Render a Text File**.
3. Pick the file.

From there it behaves exactly like a terminal capture: same themes, same frames, same three formats.

Color is not read from the file yet. Escape codes in a log written with `--color=always` are stripped rather than shown, so you get clean text without control characters in it. Tabs are expanded to eight columns so tables still line up.

> [!NOTE]
> Progress bars read oddly. A tool that redraws a line in place writes every frame to the file, and CLIsnap does not replay the overwrites, so those frames end up next to each other on one line.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| `clisnap.format` | `svg` | Format that **Capture and Save** writes |
| `clisnap.frame` | `auto` | Window frame. `auto` follows your operating system |
| `clisnap.fontSize` | `14` | Text size of the output, in pixels |
| `clisnap.fontFamily` | *(empty)* | Font to render with. Empty means the font the terminal reported |
| `clisnap.lineHeight` | `1.5` | Height of each line, as a multiple of the font size |
| `clisnap.padding` | `16` | Space between the output and the edge of the image, in pixels |
| `clisnap.theme` | *(empty)* | Theme to render with. Empty means whichever theme is active |

## Output formats

**SVG** is the default and the one to reach for. It stays sharp at any size, and the text is real text, so you can open it in Inkscape or Illustrator and edit the words or recolor a line. Columns are pinned to their exact width, so tables and box drawing stay aligned even on a machine without your font.

**HTML** gives you a single self-contained file. The text stays live, so readers can select it, search it, or hear it read out by a screen reader.

**PNG** is rendered at 2x so it stays crisp on a high resolution display. Use it when whatever you are pasting into will not take anything else.

> [!NOTE]
> Setting `clisnap.format` to `png` makes **Capture and Save** open the preview panel first, because turning the image into pixels needs a canvas to draw on.

## Themes

The theme list is every color theme installed in your IDE, not a set of themes bundled with CLIsnap. Pick any of them and the capture is recolored, so ANSI red becomes that theme's red.

**The theme you render with has nothing to do with the theme you work in.** Install one because you like how it photographs, never switch your IDE to it, and render with it anyway. Install a dozen and choose a different one per capture. Your IDE stays exactly as you like it while the output goes wherever you want it, which is as fine-grained as you care to make it: the palette is a per-capture choice, not a setting you have to live in.

Colors a program picked for itself, meaning 256 color and 24 bit values, are left exactly as they were. Those were never the theme's to change.

Your active theme is marked **· captured** in the list.

## Fonts

The font list is the fonts you have already configured in your IDE, read from `terminal.integrated.fontFamily`, `editor.fontFamily` and the other font settings. Nothing is bundled, and because your IDE resolves those settings to the right defaults for the machine it is on, the list is correct on Windows, macOS and Linux without CLIsnap deciding anything. The font your terminal reported is marked **· captured** and is what you get until you change it.

`clisnap.fontFamily` takes anything you type rather than only what is in the list, including a list of your own with fallbacks, such as `MesloLGS NF, Cascadia Mono`.

Changing the font does not move anything. Columns in an SVG are pinned to an exact width, so swapping the font changes the letters and nothing else: same alignment, same image size. That holds for PNG too, since it is drawn from the SVG.

> [!NOTE]
> HTML is the exception, because its text is live rather than positioned. Any monospace font is fine, which is every font the list can offer you. A proportional font typed in by hand will skew the HTML while leaving the SVG and PNG exact.

Whoever opens the file needs the font installed to see it. If they do not have it, the fallback stack takes over and the columns still line up, so the layout survives even when the letters change.

## Line height and padding

Both are sliders in the preview, and both reach SVG, PNG and HTML together. Padding is the space between the text and the edge of the image; drop it to `0` for a tight crop, or raise it for room around the output.

## Window frames

The frame around the output matches the operating system the shell is running on, so a Windows capture gets Windows caption buttons rather than macOS dots. Pick a different one in the preview, or turn the frame off entirely. The title is your terminal's own name, such as `pwsh`, `bash` or `zsh`.

## What gets captured

| What | How it comes out |
| --- | --- |
| Color | 16 color ANSI, 256 color and 24 bit, exactly as rendered |
| Attributes | bold, dim, italic, underline, strikethrough, reverse video |
| Layout | box drawing, tables and ASCII art keep their alignment |
| Wide characters | CJK and emoji take two cells, the same as in the terminal |
| Font | whatever your terminal was rendering with, unless you pick another |

## Requirements

VS Code 1.93 or later.

> [!IMPORTANT]
> **On Linux you must install a clipboard tool.** A stock Ubuntu desktop ships none, and capture cannot work without one.
>
> ```shell
> sudo apt install xclip          # X11
> sudo apt install wl-clipboard   # Wayland
> ```
>
> This is needed on the machine running VS Code, not on a remote you are connected to.

Works in Remote-SSH, WSL and container windows. The capture reads your local clipboard and saves to your local filesystem, while the frame and title follow the machine the shell is on.

## Footprint

A 41 KB download, 95 KB installed, of which the extension itself is 47 KB and the icon 13 KB. No dependencies, no bundled runtime, no background process, no network access, nothing phoning home.

Rendering happens in the extension itself. SVG and HTML are text, so they are written straight out; PNG borrows a canvas from the preview panel to turn one into pixels. Nothing is uploaded and nothing is tunneled anywhere.

## Known limits

**Integrated terminal only.** Capture uses VS Code's own terminal, so a separate terminal application cannot be captured.

**Nothing selected means nothing captured.** CLIsnap tells you rather than quietly saving whatever happened to be on your clipboard.

**PNG has a length limit that SVG and HTML do not.** Past a few thousand lines the canvas it draws on runs out of room. Save long captures as SVG or HTML.

**Long captures make large files.** 50,000 lines renders in under a second but produces roughly a 15 MB SVG, which is slow to open. HTML is about a third the size.

## Acknowledgements

Somewhat inspired by [termsnap](https://github.com/kushakjafry/termsnap) by [@kushakjafry](https://github.com/kushakjafry).
