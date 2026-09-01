# Changelog

## [1.1.0] - 2026-09-01

No keyboard shortcut is set by default. Every combination worth having is
already claimed by the editor, the terminal or the desktop, and which ones are
free differs from machine to machine. Open Keyboard Shortcuts with
`Ctrl+K Ctrl+S`, search CLIsnap, and pick your own. The editor warns you if the
key is already in use.

HTML output now carries the terminal's font. A font list ending in a comma, as
macOS reports, produced an empty entry that made the CSS rule invalid, so the
font was dropped and the text fell back to the browser default. SVG and PNG were
unaffected because they parse the font differently.

## [1.0.9] - 2026-08-31

One shortcut everywhere: `Ctrl+C, S`, or `⌘C, S` on macOS. Hold the modifier and
press C for capture, S for save. Earlier versions used a different combination
per platform, and the single-modifier ones were unreliable: on Linux the desktop
and the terminal claim them first.

If you rebind the shortcut yourself it overrides this default, and Settings Sync
carries that binding to your other machines.

## [1.0.8] - 2026-08-31

The Linux shortcut is now `Ctrl+C, S`: hold `Ctrl` and press `C` then `S`.
Single-modifier combinations do not survive on Linux, where the desktop and the
terminal claim them first, so a chord is used instead. Windows and macOS keep
`Ctrl+Alt+S` and `Cmd+Alt+S`.

## [1.0.7] - 2026-08-31

The shortcut on Linux is now `Ctrl+Shift+S`. Alt is claimed by GNOME and by the
terminal itself, so pressing it revealed menu accelerators rather than
capturing. Windows and macOS are unchanged.

## [1.0.6] - 2026-08-31

Marketplace keywords widened so searches for cli, console, image, snippet,
share and carbon find the extension. Nothing about the extension itself changed.

## [1.0.5] - 2026-08-31

The save dialog opened at the filesystem root on Linux, because a bare filename
was passed where an absolute path was expected. It now opens in the workspace
folder, or your home folder when there is no workspace.

When no clipboard tool is installed, the error now names the package to install.
A stock Ubuntu desktop ships neither `xclip` nor `wl-clipboard`.

## [1.0.4] - 2026-08-30

Works in Remote-SSH, WSL and container windows. Reading the clipboard needs a
platform command, and that was running wherever the extension host was, so in a
remote window it read the remote machine's clipboard rather than yours and
capture failed. The extension is now pinned to the local machine, which also
puts the save dialog back on your own filesystem.

The window frame follows the remote instead of the local machine in those
windows, so an SSH session to Linux still gets a Linux frame.

## [1.0.3] - 2026-08-30

Readme screenshots reduced to 230px so they sit side by side in the Extensions
view and on the marketplace rather than stacking.

## [1.0.2] - 2026-08-30

Screenshots in the readme sit side by side in the narrower panes used by the
Extensions view and the marketplace, instead of stacking.

## [1.0.1] - 2026-08-30

Automated releases. Tagging a version now type-checks, builds, packages, verifies
that nothing internal is in the package, publishes to the marketplace, and
attaches the `.vsix` to the GitHub release.

## [1.0.0] - 2026-08-30

First public release. What CLIsnap is and what it does is described in the README; there is
no earlier version for this file to describe a change from. Every release after this one
records what was added, changed or fixed since the last.
