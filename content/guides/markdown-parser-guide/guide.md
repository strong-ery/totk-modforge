# ModForge Markdown Reference

A complete reference for all supported syntax when writing guides for this site.

:::credit
Reference guide by the ModForge team.
:::

---

## Text Formatting

Standard inline formatting works as expected.

**Bold text** is wrapped in double asterisks. *Italic text* uses single asterisks. ~~Strikethrough~~ uses double tildes. You can combine them — ***bold and italic*** together.

For inline code like `RESTBL.exe` or a value like `0x1A4F`, wrap in backticks.

Use [mark]highlight[/mark] to draw attention to a specific value or word inline without breaking flow.

For file paths and filenames, use the file chip tag: [file]Actor/Pack/MyActor.pack[/file]. This keeps paths visually distinct from prose.

For keyboard shortcuts or button inputs, use the key tag: [key]Ctrl+S[/key], [key]Shift+F5[/key], [key]A Button[/key].

For colored text use the color tag: [color=#00ff99]green text[/color], [color=#ff5555]red text[/color], [color=#4da6ff]blue text[/color]. Use sparingly — good for highlighting specific values in a sentence.

---

## Headings

```
# H1 — Page title, used once at the top
## H2 — Major section
### H3 — Subsection
#### H4 — Minor label or callout heading
```

H2 headings and above are automatically added to the table of contents in the sidebar.

---

## Links

Standard markdown links: [link text](https://example.com). External links open in a new tab automatically.

---

## Lists

Unordered:

- First item
- Second item
- Third item

Ordered:

1. First step
2. Second step
3. Third step

---

## Blockquote

> Use blockquotes for sourced information, community notes, or supplementary context that isn't critical to the main flow.

---

## Code Blocks

Fenced with triple backticks. Optionally specify a language for the label:

```bash
restbl.exe --update ./romfs
```

```json
{
  "title": "My Guide",
  "type": "article"
}
```

A copy button appears automatically on every code block.

---

## Images

Standard markdown image syntax with an optional attribute block:

```
![Alt text](path/to/image.png){width=600 align=center caption="Caption text"}
```

- `width` — max width in pixels
- `align` — `left`, `center`, or `right` (default: center). Left and right float with text wrapping.
- `caption` — displayed below the image

![Example banner](assets/HomeImages/modelswappingbanner.jpg){align=center caption="A full-width banner with a caption"}

---

## Callout Blocks

Four types. Each opens with `:::type` and closes with `:::`.

:::tip
Use tip for helpful shortcuts, best practices, or anything that makes the process easier but isn't required.
:::

:::info
Use info for background context, explanations of why something works the way it does, or supplementary detail.
:::

:::warning
Use warning for things that will cause problems if ignored — version mismatches, order-dependent steps, known gotchas.
:::

:::danger
Use danger for anything that can corrupt files, brick a setup, or cause data loss. This should be rare.
:::

---

## Steps

Use steps for sequential processes where order matters. Each line is `Title :: Description`.

:::steps
Open the file :: Navigate to [file]Actor/Pack/[/file] and open your target [file].pack[/file] in Switch Toolbox.
Edit the contents :: Make your changes inside the archive. Don't save intermediate copies.
Rebuild the table :: Run [key]restbl.exe[/key] from your mod root to regenerate the resource size table.
Test in game :: Boot the game and verify the change loads correctly before moving on.
:::

---

## File Tree

Use filetree to show folder structures. Indent with 2 spaces per level. Folders end with `/`.

:::filetree
romfs/
  Actor/
    Pack/
      MyActor.pack
      VanillaActor.pack
  Model/
    MyActor.bfres
  System/
    Resource/
      ResourceSizeTable.Product.121.rsizetable
:::

---

## Compare

Side by side image comparison. Useful for before/after, vanilla vs modded, correct vs incorrect.

:::compare
left: assets/HomeImages/ModForge_Banner.jpg | Before
right: assets/HomeImages/ModForge_Banner_Blue.jpg | After
:::

---

## Collapsible Sections

Use collapse for supplementary content, verbose reference material, or troubleshooting steps that would clutter the main flow.

:::collapse Full file list for reference
This content is hidden by default. Click the title to expand.

You can put any content in here including **bold text**, `inline code`, lists, and even other block elements.

- Item one
- Item two
- Item three
:::

:::collapse What to do if this step fails
Check the following in order:

1. Verify your RomFS dump is from the correct game version
2. Confirm RESTBL was run after all edits, not before
3. Check Switch Toolbox's console output for silent errors
:::

---

## Credits

Place a credit block at the bottom of any guide that draws on community research. It renders as a quiet attribution line.

:::credit
Written by YourName. Research contributions by Contributor 1, Contributor 2, and the TotK modding Discord.
:::

---

## Horizontal Rule

Use `---` on its own line to insert a divider. Good for separating major sections that don't warrant a heading.

---

## Entry JSON Reference

Each guide entry on the hub is defined by a JSON file in [file]content/guides/[/file].

```json
{
  "title":       "Guide Title",
  "date":        "2024-03-15",
  "type":        "article",
  "image":       "assets/HomeImages/yourbanner.jpg",
  "description": "Short description shown on the hub card.",
  "url":         "guide.html?src=Guides/YourGuide/guide.md",
  "tags":        ["wip"],
  "credit":      "AuthorName"
}
```

Then add the filename to [file]content/guides/manifest.json[/file]:

```json
["existing-guide.json", "your-new-guide.json"]
```

The hub will fetch it, sort it by date, and display it automatically.