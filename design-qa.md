# CareYield patient finder — design QA

**Source visual truth**

- Path: `design/careyield-selected-direction.png`
- Source pixels: 853 × 1858.
- Normalization: aspect-fill downsampled to 390 × 844 for direct content-only comparison.

**Rendered implementation**

- Final screenshot: `qa/13-match-final.png`
- Combined comparison: `qa/14-source-vs-final.png`
- Implementation pixels: 390 × 844.
- CSS viewport: 390 × 844; density: 1× browser capture.
- Route/state: `/`, default spoken request, first tailored match.
- Additional evidence: `qa/00-welcome.png`, `qa/01-listening.png`, `qa/07-profile-fixed.png`, `qa/08-request-success.png`, `qa/10-all-matches-settled.png`, and `qa/11-desktop-responsive.png`.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation uses Newsreader Variable for the editorial request and Inter Variable for product UI. The request line breaks, hierarchy, weight contrast, and optical spacing match the source at 390 px. Longer user requests are intentionally clamped to two lines on the match screen so the clinician and primary action remain visible; the full text remains editable through **Refine**.
- Spacing and layout rhythm: header, request, portrait, details, and primary action preserve the source order and above-the-fold proportions. The final primary action is fully visible at 390 × 844. No hidden horizontal overflow was observed.
- Colors and visual tokens: warm paper, near-black, muted stone, and restrained sage match the source. Sage is limited to request context and availability; elevation is used only for tactile controls.
- Image quality and asset fidelity: all eight clinician portraits are 1024 × 1024 project-local raster assets with consistent quiet consulting-room art direction. The final match uses a real portrait asset with a responsive object-fit crop; no placeholder, custom SVG, or CSS-drawn imagery is used.
- Copy and content: the selected source copy is preserved for the default match. Demo additions use plain-language focus and experience descriptions, avoid ratings and testimonials, and make no outcome claims.
- Icons: all interface icons come from one Phosphor family at light/regular weights. No handcrafted SVG or glyph stand-ins are present.
- Accessibility and behavior: visible focus treatment, semantic buttons, a labelled text area, labelled appointment radio group, reduced-motion support, alt text, and practical tap targets are present. Voice, text, loading, match, roster, profile, appointment, disabled, selected, and success states were exercised.
- Responsive behavior: the 390 × 844 mobile viewport and a 1440 × 1024 desktop viewport were captured. Desktop keeps a focused 440 px app surface without changing the mobile hierarchy.

## Full-view comparison evidence

`qa/14-source-vs-final.png` places the normalized source and final implementation in the same image. It shows matching content order, two-line editorial request, photo-led profile hierarchy, near-identical warm neutral balance, and a fully visible black primary action.

## Focused region comparison

A separate crop was not needed: both halves of the combined comparison are native 390 × 844 and the request typography, portrait crop, clinician details, availability, and button labels are legible at 1:1. Profile and roster details were inspected separately in their browser-rendered screenshots.

## Comparison history

### Pass 1 — blocked

- Evidence: `qa/02-match-before-qa.png`.
- [P1] The primary profile action fell below the 390 × 844 viewport because the request region wrapped to three lines and the portrait/details stack was too tall.
- [P2] Next.js development chrome appeared over the app.
- [P1 behavior] A request mentioning both ADHD and clear explanations tied on generic manner terms and incorrectly left the default clinician first.
- Fixes: reduced and clamped the request region, rebalanced portrait/details heights, compacted vertical gaps, disabled development indicators, and weighted specific focus terms above general manner terms.

### Pass 2 — blocked

- Evidence: `qa/04-profile.png`.
- [P1] The profile’s fixed appointment action was not visible because the screen entrance transform created the wrong containing block.
- [P2] The profile header inherited page scroll and appeared cropped after navigating from the match.
- Fixes: changed the profile entrance to opacity-only and reset scroll on every screen transition.

### Pass 3 — passed

- Evidence: `qa/07-profile-fixed.png`, `qa/13-match-final.png`, and `qa/14-source-vs-final.png`.
- The profile action is persistently visible, the header begins at the top edge, the match CTA is above the fold, focus-aware ranking returns ADHD/heart/kidney/dialysis matches first when requested, and the browser console reports no errors.
- Remaining P3: generated clinician portraits intentionally vary by person, so the final Maya crop is slightly less close than the concept portrait. Art direction, lighting, surface palette, and hierarchy remain aligned.

## Primary interactions tested

1. Start and finish the simulated 20-second voice description.
2. Review and refine the interpreted request.
3. Generate matches and open the first clinician.
4. Type an ADHD-specific request and verify Dr Tom Bennett ranks first.
5. Open the eight-clinician all-matches list.
6. Open a full profile, request an appointment, select a time, and reach the success state.
7. Check browser console errors: none.

## Implementation checklist

- [x] Selected visual faithfully translated at 390 × 844.
- [x] Eight distinct synthetic clinicians and portraits included.
- [x] Specific focus terms affect ordering.
- [x] Core flow works from request to appointment success.
- [x] Mobile and desktop viewport checks complete.
- [x] Typecheck, unit tests, production build, and browser QA complete.

final result: passed
