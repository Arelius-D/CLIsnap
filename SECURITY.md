# Security Policy

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report it privately through GitHub:

1. Go to the [Security tab](https://github.com/Arelius-D/CLIsnap/security) of this repository.
2. Choose **Report a vulnerability**.

That opens a private advisory visible only to the maintainer. Please include:

- what the issue allows an attacker to do,
- the terminal output or file that triggers it, reduced to the smallest example you can manage,
- your operating system and VS Code version,
- the affected version or commit.

You will get an initial response as quickly as is practical. This is a single-maintainer project, so please allow reasonable time before disclosing publicly.

---

## What this extension touches

CLIsnap has a small surface, but it is not zero.

- **The clipboard.** Capturing writes a marker to the clipboard, asks VS Code to copy the terminal selection, reads the result, and restores what was there before.
- **A short-lived shell process.** VS Code's extension API cannot read the clipboard's HTML flavour, so one platform command is run to fetch it: `powershell` on Windows, `osascript` on macOS, `xclip` or `wl-paste` on Linux. Its output goes through a temporary file that CLIsnap creates and deletes.
- **Theme files on disk.** Color themes contributed by your installed extensions are read to build the palette list.
- **A file you choose.** Only when you run **Render a Text File**, and only the file picked in the dialog, up to 8 MB.
- **Files you save.** Only where the save dialog puts them.

It makes **no network requests**, opens no ports, runs no background process, and has no runtime dependencies.

---

## The part worth attacking

**Terminal output is untrusted input.** Anyone can print anything into a terminal, including markup, and CLIsnap turns that into an SVG or HTML document you might then send to someone else. If crafted output could smuggle live content into a saved file, that file would run it in whoever opens it.

Two deliberate defenses:

- The parser rebuilds the document from a **whitelist**. Only `div`, `span` and `br` survive, and only a fixed set of color and text-decoration properties with values matched against strict patterns. Everything else is discarded rather than escaped.
- The preview panel runs under a Content Security Policy with **no inline styles or scripts**. Styles from a capture are hoisted into a nonce-carrying stylesheet, never inline attributes.

If you find output that defeats either of those, that is the report I most want to see.

---

## In scope

- Terminal output or a rendered file that results in executable content in a saved SVG or HTML file.
- Anything that escapes the webview's Content Security Policy.
- Command or argument injection through the platform clipboard call.
- A path traversal or overwrite that writes outside the location chosen in the save dialog.
- Clipboard contents being left altered, exposed, or sent anywhere.
- A crafted theme file that causes code execution rather than being parsed as data.

## Out of scope

- Reading the clipboard and the terminal selection. That is what the extension is for.
- The temporary file used to move clipboard data between the shell command and the extension, unless you can show it is readable or replaceable by another user.
- Denial of service from feeding it something enormous. Very large captures produce very large files; this is documented, not a vulnerability.
- Vulnerabilities in VS Code, xterm.js, `xclip` or the operating system. Report those to their maintainers.

---

## Supported versions

Only the latest published version receives fixes.
