# Changelog

## 1.1.0 - 2026-07-05

- Fixed VIP progress detection after Stake changed the progress bar markup from `data-melt-progress` to `role="progressbar"` / `data-progress-root` inside `current-vip-level-*` cards.
- Added a simple popup with one **Generate bug report** button.
- Bug reports download as JSON and include extension version, page URL, active selectors, selector counts, VIP candidate elements, and recent diagnostic events with stack snippets.
- Bug report generation now handles non-Stake tabs gracefully by downloading a small context report instead of freezing.
- Removed temporary console debug output and manual debug helpers.
- Added Firefox MV3 add-on metadata and no-data-collection declaration for AMO validation.
- Replaced dynamic `innerHTML` injection with DOM node construction.
