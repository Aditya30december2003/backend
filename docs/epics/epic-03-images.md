# EPIC 03: Images and Grid Efficiency

## Domain

- Movies / Presentation

## Problem

The app is image-heavy but image optimization is disabled, and card/grid rendering is more expensive than it should be.

## Goal

Restore sane image handling and reduce card/grid hydration cost.

## Non-goals

- no full visual redesign
- no removal of all motion from the product

## Required reviews before implementation

- architecture review
- performance review
- dependency review

## Planned sequence

1. re-enable image optimization
2. replace raw `<img>` on critical screens
3. define image sizing rules
4. reduce `MovieBlock` hydration cost
5. defer heavy controls and motion where justified

## Ticket map

- `E3-T01`
- `E3-T02`
- `E3-T03`
- `E3-T04`
- `E3-T05`
- `E3-T06`

## Exit criteria

- image optimization restored
- critical raw `<img>` usage reduced
- grid/card runtime cost is lower and more deliberate
