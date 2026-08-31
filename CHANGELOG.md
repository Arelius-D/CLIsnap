# Changelog

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
