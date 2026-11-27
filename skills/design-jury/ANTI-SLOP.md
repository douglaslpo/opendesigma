# Anti-slop checklist (Design Jury)

Brand-agnostic craft fails that mark AI/default UI. Flag each hit as a finding
under the **Craft** seat. Project `DESIGN.md` personality wins when it
intentionally contradicts a row (cite the section).

Adapted for OpenDesigma from Open Design–style craft gates and the product
frontend rules — not a clone of any upstream prompt dump.

## Instant flags

| Pattern | Why it fails |
| --- | --- |
| Purple-on-white / purple→indigo gradient as default look | Interchangeable “AI UI” |
| Warm cream `#F4F1EA` + terracotta + generic serif hero | Clustered template look |
| Broadsheet: hairline rules, zero radius, dense newspaper columns | Style cosplay without product fit |
| Glow / neon blur as primary atmosphere | Decoration, not product UI |
| Pill clusters / stat strips / icon rows in the first viewport | Hero budget blown |
| Cards wrapping non-interactive content | Card theater |
| Inset / floating hero media on a landing surface | Weak brand plane |
| Detached badges / stickers overlaid on hero media | Noise over hierarchy |
| `transition: all` · `ease-in` on UI · `scale(0)` | Motion slop |
| Raw hex beside an existing token scale | DS bypass (also a DS seat fail) |
| Invented Button / Modal / Toast when registry has one | Hallucinated primitive |
| Lorem / dead buttons in “done” UI | Dishonest finish |
| Default stacks (Inter/Roboto/Arial/system) when project fonts exist | Type laziness |
| Flat single-color page with no atmosphere **and** no product imagery | Empty composition |

## Hero budget (promotional / landing)

First viewport should usually hold only:

1. Brand (hero-level, not just nav)
2. One headline
3. One short supporting sentence
4. One CTA group
5. One dominant image / atmosphere plane

Anything else in that viewport → finding.

## Brand test

If removing the nav would let another product own the first viewport, branding
is too weak → Craft finding (severity unless `DESIGN.md` defines a quiet brand).

## Remedial order

1. Delete decoration  
2. Reuse token / registry component  
3. Reduce competing blocks  
4. Fix hierarchy / type  
5. Fix motion / a11y  
6. Polish  

## Not slop (do not flag blindly)

- Documented DS colors that happen to include purple/teal/etc.
- Cards that **are** the interaction surface (forms, selectable rows)
- Dense data UI (tables, IDEs) that is not a marketing hero
- Intentional editorial layouts called out in `DESIGN.md`
