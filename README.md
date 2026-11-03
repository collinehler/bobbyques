# Bobby-Ques website

The website for Bobby-Ques, 506 Argyle St, Waterloo, Iowa.

## Making a change from your phone

1. In Safari, open this repository on github.com and tap `index.html`. Almost everything people read is in that file.
2. Tap the pencil icon (Edit). If you don't see it, tap the three dots and choose Edit file.
3. Find the section by its note in CAPITALS (MENU, HOURS, ABOUT US, CATERING, NOTICE and so on).
   Change only the words or numbers.
4. Tap **Commit changes**. The site updates a few minutes later.

## Common changes

- **Price or menu item:** in the MENU section. Prices are between `<b>` and `</b>`, names between `<span>` and `</span>`.
- **Hours:** only in the HOURS table near the bottom. The open/closed sign and the hours Google reads update from it.
- **Holiday or day off:** add a row with the date to the HOURS table, like `Saturday, November 28, 2026` and `Closed`.
  The sign says "Closed today" that day, and the row hides itself after the date passes.
  A date row can have special hours instead, like `11 AM to 3 PM`.
- **News or announcements:** type a short line in the NOTICE spot near the top. Empty it again afterward.
- **Catering requests going to a different email:** change `data-email="..."` in the CATERING section.
- **Logo:** upload a new picture named `logo.png` into the `images` folder.

## What's where

- `index.html`: everything people read (menu and prices, hours, about us, catering, address)
- `styles.css`: colors, fonts and layout. The colors at the top come from the logo.
- `script.js`: the open/closed sign, the hours for Google, and the catering request form
- `images`: the logo, the small emblem, the icons and the link-preview picture
- `fonts`: the fonts

## Launch day

1. In `index.html`, delete the PREVIEW line (the one with `noindex`) and the PREVIEW BANNER line.
2. In `index.html`, in the LINK PREVIEW lines, change `collinehler.github.io/bobbyques` to `eatbobbyques.com`.
3. Connect eatbobbyques.com in this repository's Settings > Pages, and point the domain there from GoDaddy.
4. Turn on "Enforce HTTPS" in Settings > Pages once it's available.
