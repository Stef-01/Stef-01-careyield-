# CareYield patient finder — design QA

**Source visual truth**

- Path: `design/careyield-selected-direction.png`
- Source pixels: 853 × 1858.
- Normalization: aspect-fill downsampled to 390 × 844 for direct content-only comparison.

**Rendered implementation**

- Final screenshot: `qa/20-pcos-match-final.png`
- Combined comparison: `qa/23-source-vs-pcos-final.png`
- Implementation pixels: 390 × 844.
- CSS viewport: 390 × 844; density: 1× browser capture.
- Route/state: `/`, default South Indian PCOS spoken request, first tailored match.
- Additional evidence: `qa/18-pcos-welcome.png`, `qa/19-pcos-review.png`, `qa/21-pcos-roster.png`, `qa/22-pcos-profile.png`, `qa/24-pcos-desktop.png`, `qa/25-practical-match.png`, `qa/26-practical-roster.png`, `qa/27-practical-profile.png`, and `qa/08-request-success.png`.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the implementation uses Newsreader Variable for the editorial request and Inter Variable for product UI. The request line breaks, hierarchy, weight contrast, and optical spacing match the source at 390 px. Longer user requests are intentionally clamped to two lines on the match screen so the clinician and primary action remain visible; the full text remains editable through **Refine**.
- Spacing and layout rhythm: header, request, portrait, compact fit signals, details, and primary action preserve the source order and above-the-fold proportions. The final primary action is fully visible at 390 × 844. No hidden horizontal overflow was observed.
- Colors and visual tokens: warm paper, near-black, muted stone, and restrained sage match the source. Sage is limited to request context and availability; elevation is used only for tactile controls.
- Image quality and asset fidelity: all eight clinician portraits are 1024 × 1024 project-local raster assets with consistent quiet consulting-room art direction. The final match uses a real portrait asset with a responsive object-fit crop; no placeholder, custom SVG, or CSS-drawn imagery is used.
- Copy and content: the source hierarchy is preserved while the default content now demonstrates a South Indian PCOS use case. Fit reasons distinguish PCOS expertise, women’s health, mental-health care, cultural context, language and appointment style; wording avoids ratings, testimonials, identity assumptions and outcome claims.
- Icons: all interface icons come from one Phosphor family at light/regular weights. No handcrafted SVG or glyph stand-ins are present.
- Accessibility and behavior: visible focus treatment, semantic buttons, a labelled text area, labelled appointment radio group, reduced-motion support, alt text, and practical tap targets are present. Voice, text, loading, match, roster, profile, appointment, disabled, selected, and success states were exercised.
- Responsive behavior: the 390 × 844 mobile viewport and a 1440 × 1024 desktop viewport were captured. Desktop keeps a focused 440 px app surface without changing the mobile hierarchy.

## Full-view comparison evidence

`qa/23-source-vs-pcos-final.png` places the normalized source and final PCOS implementation in the same image. It shows matching content order, two-line editorial request, photo-led profile hierarchy, near-identical warm neutral balance, compact fit signals, and a fully visible black primary action.

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

### Pass 4 — passed (post-merge regression)

- Re-ran the 390 × 844 match-state comparison against the selected direction after merging `origin/main`; typography, hierarchy, portrait treatment, availability emphasis, and the above-the-fold primary action remain aligned.
- Rechecked the patient welcome, eight-clinician roster, ADHD-focused profile, practices landing, and practice sign-in at mobile breakpoints, plus the patient finder and practices landing at 1440 px.
- [P2] The practices header compressed four links into the 390 px viewport. The two secondary section anchors now collapse below the `sm` breakpoint, leaving a balanced CareYield / Practice sign-in header with no horizontal overflow; all four links remain visible on desktop.
- A fresh post-restart browser session reports no warnings or errors, all clinician images load at non-zero natural dimensions, and the inspected routes have no horizontal overflow.

### Pass 5 — passed (PCOS prototype)

- Initial evidence: `qa/20-pcos-match-before-compact.png`.
- [P1] Adding three fit signals and a longer culturally specific request pushed the primary profile action below the 390 × 844 viewport.
- [P2] The two-line request clamp ended on a mid-word ellipsis, weakening the most important content at the top of the match.
- Fixes: changed the interpreted headline to the concise “PCOS, cultural and mental-health care,” removed the redundant match-line paragraph from the compact result card, and kept the full rationale on the clinician profile.
- Post-fix evidence: `qa/20-pcos-match-final.png` and `qa/23-source-vs-pcos-final.png`.
- The final result has no page overflow, keeps the primary action fully visible, and preserves the selected direction’s portrait-led hierarchy. The first four results intentionally cover culturally responsive PCOS care, South Asian women’s health, PCOS metabolic care, and broader mental-health support.

### Pass 6 — passed (practical access details)

- Evidence: `qa/25-practical-match.png`, `qa/26-practical-roster.png`, and `qa/27-practical-profile.png`.
- [P2] The first implementation of billing and travel tags added 12 px of vertical overflow to the 390 × 844 match state.
- Fix: compacted only the result-detail spacing while preserving portrait size, typography, and tap-target height.
- The final match again measures 390 × 844 with no horizontal or vertical page overflow. Billing and travel time are visible beside the clinical fit signals, while appointment style, telehealth and accessibility details remain available on the profile and roster.

### Pass 7 — passed (clinician practice pathway)

- Evidence: `qa/28-clinician-goal-mobile.png`, `qa/29-clinician-feed-mobile.png`, `qa/30-clinician-briefing-mobile.png`, `qa/31-clinician-practice-mobile.png`, and `qa/32-clinician-desktop.png`.
- The new `/clinicians` walkthrough reduces the clinic-facing concept to four progressive stages: practice direction, concentrated case mix, tomorrow’s briefing, and the longer practice flywheel.
- [P2] Removing unused demo focus areas initially left the selected women’s-health direction in one third of a desktop grid.
- Fix: collapsed the focus grid to a single responsive column. The selected direction now occupies the panel cleanly at both 390 px and 1440 px, with no horizontal overflow.
- The briefing progress control updates from 1/5 to 2/5 when a resource is reviewed, all five source links are exposed semantically, direct stage navigation works, and the browser console reports no warnings or errors.
- Current guideline, prescribing-safety and recent-evidence cards are visually distinguished without implying credentialing or measured competence; case details are explicitly synthetic.

## Primary interactions tested

1. Start and finish the simulated 20-second voice description.
2. Review and refine the interpreted request.
3. Generate matches and open the first clinician.
4. Type an ADHD-specific request and verify Dr Tom Bennett ranks first.
5. Open the eight-clinician all-matches list.
6. Open a full profile, request an appointment, select a time, and reach the success state.
7. Check browser console errors: none.
8. Verify the PCOS demo ranks Priya, Maya, Sofia and Noah first with distinct visible fit reasons.
9. Verify every profile exposes billing, travel time and one additional practical access detail, with demo travel times capped at 30 minutes.
10. Set a 30% women’s metabolic/reproductive-health direction and open the generated PCOS case mix.
11. Open tomorrow’s five-part learning briefing, mark a resource reviewed, and verify progress updates.
12. Open the practice flywheel, navigate directly between stages, and verify the clinician route at 390 × 844 and 1440 × 1000.

## Implementation checklist

- [x] Selected visual faithfully translated at 390 × 844.
- [x] Eight distinct synthetic clinicians and portraits included.
- [x] Specific focus terms affect ordering.
- [x] Core flow works from request to appointment success.
- [x] Mobile and desktop viewport checks complete.
- [x] Post-merge practices and console regression checks complete.
- [x] South Indian PCOS request, review priorities, ranked results and profile rationale complete.
- [x] Billing, travel time and practical access tags complete.
- [x] Clinician direction, concentrated PCOS case mix, case-specific briefing and practice flywheel complete.
- [x] Typecheck, unit tests, production build, and browser QA complete.

final result: passed
