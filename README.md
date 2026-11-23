# Two Years of Us

A static second-anniversary website with an interactive Three.js heart.

## Preview

Start a local web server:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8080>.

The Three.js file loads from jsDelivr, so previewing needs internet access.

## Add photos to the site

1. Add up to nine images to the `photos` folder.
2. Name them `memory-1.jpg` through `memory-9.jpg`.
3. Reload the page.

The cards keep their placeholders when an image is missing.

## Change the messages

Edit each `data-message` value in `index.html`. Each memory card has one message.

You can also change each card's heading and short text.

## Change the other words

Edit the remaining text in `index.html`. The memory cards live inside the `#memories` section.

The site needs no package install or build step.
