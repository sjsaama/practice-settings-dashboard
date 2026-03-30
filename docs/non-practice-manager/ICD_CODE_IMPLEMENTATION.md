# ICD Codes in Generated Clinical Notes — Implementation (Combined)

**Last updated:** March 26, 2026  
**Scope:** How ICD codes are produced, edited, and pushed to EHRs (Athena vs non-Athena), plus how the Marvix Code Search service fits in.

---

## 1) Overview

Marvix embeds ICD codes into AI-generated clinical notes using **inline markers** that render as an **inline widget** in the web note editor. The intended user experience is:

- **AI suggests/adds ICD codes automatically** during note processing.
- Clinicians **usually do not add ICD codes manually**.
- Clinicians can **review and edit** AI-added ICD codes when needed, because the selected ICD code corresponds to a **diagnosis/problem description** that is pushed to the EHR in structured form.

There are two sources of ICD codes:

- **LLM tagging in the note text** (bracket markers like `[[...]]`)
- **Marvix Code Search service** (`https://api.marvixapp.ai/code-search`) used to search/match ICD codes and map SNOMED → ICD

---

## 2) How ICD Codes Are Generated (Process Note)

When a user clicks **Process Note**, the backend LLM returns note text containing ICD markers using a bracket format:

- `[[new]]`
  - Meaning: AI did not choose a specific code (manual selection required via widget).
- `[[SNOMED code, ICD code]]`
  - Meaning: AI identified a code and embedded both SNOMED and ICD.

> The prompt/template likely contains a list of ICD codes and/or selection rules. The exact prompt structure is an open question (see Section 7).

### 2.1 Why the patient problem list is relevant for a new consult

Although the note (including Assessment) is generated **per consult**, many consults are follow-ups where clinicians assess/manage **ongoing chronic conditions** (e.g., diabetes, HTN, asthma). The patient’s existing EHR problem list provides a high-confidence candidate set for ICD/SNOMED selection when today’s assessment matches a known diagnosis. This:

- improves consistency across visits,
- reduces LLM “guessing” / invented mappings,
- increases likelihood the SNOMED/ICD pair is accepted by the EHR (especially important in Athena flow).

**Important:** this does not mean reusing all past problems for every consult; it’s a candidate pool used only when relevant to today’s assessment.

### 2.2 Why the doctor common problems list is relevant

If no suitable match exists in the patient problem list, the doctor’s “common problems” list acts as a curated fallback candidate set. It narrows the search space to diagnoses commonly seen for that provider and is typically more reliable than heuristic lookup.

---

## 3) Web Frontend Rendering (Inline Widget)

The web note editor is HTML-based.

- On render/load:
  - Any `[[]]` marker encountered in the note HTML is replaced **in-place** with an interactive HTML element (e.g., a `<span>` styled as a button).
  - `[[new]]` renders as an **“Add ICD Code”** control.
  - `[[SNOMED, ICD]]` renders as a **pre-filled ICD code control**.

- On save:
  - The widget element is converted back into the bracket format so the note can be persisted and re-rendered later.

**Section restrictions (frontend):**
- The web frontend intentionally does **not** hard-restrict by section; it converts markers wherever they appear.

---

## 4) Where ICD Codes “Live”

Where ICD codes “live” depends on the target EHR integration:

- **Athena**: ICD codes are embedded **inline in the clinical note**, specifically in **Assessment with Problems** next to each bullet/problem.
- **Other EHRs (non-Athena)**: ICD codes are represented as a **separate ICD note/structure** (not inline in the main clinical note the same way as Athena).

- The source of truth is the note text containing bracket markers.
- Structured EHR payload generation later **parses/extracts** ICD codes from the note content (with section-specific rules depending on EHR).

---

## 5) EHR Push Behavior

### 5.1 Athena (special case)

For Athena, ICD codes are added in the **Assessment with Problems** section **next to each bullet/problem**.

- Each assessment bullet/problem becomes its own structured diagnosis entry in Athena.
- The ICD code selected for that bullet is pushed along with the diagnosis/problem description (and any additional data required by Athena).

Clinician editing matters here because **the code corresponds to the diagnosis description** that Athena stores in a dedicated problem/diagnosis area.

### 5.2 Other EHRs (non-Athena)

For other EHRs, ICD codes are represented as a **separate note/structure** (not inline within the main clinical note in the same way as Athena).

Practical implication:
- The inline-marker + widget approach may still be used in Marvix UI for consistency, but the downstream EHR push expects ICDs in a **separate ICD-specific payload/note**.

### 5.3 Handling ICD codes outside Assessment

ICD codes are intended to appear only in the **Assessment with Problems** section.

- If markers appear outside Assessment, they should not be used for structured diagnosis push.
- The bracket markers are stripped/discarded before pushing the rest of the note content.

---

## 6) Marvix Code Search Service (Search + Mapping)

This service is documented in the “New ICD Search API” doc (hosted in Linear) and is the backend for:
- ICD-10-CM search/lookup
- SNOMED-CT → ICD-10-CM mapping search (including free-text “problem” search)

### 6.1 Base + Auth

- Base path: `https://api.marvixapp.ai/code-search`
- Swagger: `https://api.marvixapp.ai/code-search/docs`
- Auth header (required for all except `healthz`):
  - `Authorization: Bearer <production JWT>`
  - Uses the same production JWT as the main app (shared secret).

### 6.2 Primary endpoint: SNOMED → ICD mapping search

`GET /code-search/snomed-icd/search?q={query}&limit={limit}&offset={offset}&icd_code={prefix}&snomed_code={prefix}`

`q` can be:
- SNOMED code (digits, e.g. `29857009`)
- ICD code/prefix (e.g. `R07`, `E11.9`)
- Free text problem (e.g. `chest pain`, `diabetes`)

Ranking:
1) relevance score  
2) `mapPriority` ascending  
3) `mapGroup` ascending

**`top_result` definition:**
- `top_result` is a convenience field that is always the **first item in `results`** (or `null` if there are no results).
- Since `results` is already sorted by the ranking rules above, `top_result` is the **best-ranked** mapping candidate.

The response includes `top_result` plus fields like:
- `snomed_code`, `snomed_description`
- `icd_code`, `icd_description`
- `mapRule`, `mapAdvice`, `mapGroup`, `mapPriority`

### 6.3 ICD-10-CM endpoints (secondary)

- Search: `GET /code-search/icd10cm/search?q=...`
- Lookup: `GET /code-search/icd10cm/lookup?code=...` (returns coding notes; 404 if missing)

---

## 7) Reported Issues / Escalations (From Slack)

This section summarizes notable user-reported issues and internal escalations observed in Slack (early 2026). Treat as directional signal; confirm exact repro steps in the linked threads.

### Athena: diagnoses not creating separate boxes

- Reported escalation: some diagnoses were **not creating separate boxes** in Athena.
- Investigation finding: failures traced to **invalid SNOMED codes** for those diagnoses.
- Suspected contributing causes discussed internally:
  - LLM can sometimes invent SNOMED↔ICD mappings not accepted by Athena
  - Marvix DB may contain SNOMED↔ICD mappings Athena rejects

### Athena: multiple doctor escalations on ICD coding

- Reported: multiple doctors escalating that ICD-coding behavior/push is failing or incorrect; requests to prioritize.

### Web UI: ICD search box string search not working (Athena users / ICD-2)

- Reported: the ICD search box “string search” isn’t working properly for Athena users.

### UI gating: “Add ICD Code” button appears unexpectedly

- Reported: “Add ICD code” button appears even when the section does not have `icd_coding` enabled.
- Related concern: Add-ICD option appearing in multiple sections (section leakage / property mapping mismatch).

### Push failures: valid ICD but SNOMED rejected by Athena

- Observed error pattern: ICD code may be valid but Athena rejects the SNOMED with errors like “SNOMED code not valid”, causing structured diagnosis push failures.

---

## 8) Open Questions / Items to Confirm

### LLM + marker generation
1. When does the LLM output `[[new]]` vs `[[SNOMED, ICD]]`?
2. Is the LLM explicitly instructed to only place ICD markers in **Assessment with Problems**?
3. What is the exact prompt/template structure used for code selection (static list vs dynamic lookup)?

### Widget + search UX
4. When a clinician clicks “Add ICD Code” (`[[new]]`), what text is used as the search query `q`?
   - problem header, bullet text, surrounding sentence, or the full problem paragraph?
5. Do we have SNOMED codes available at edit time, or only free-text?
6. Do we allow multiple ICD codes per assessment bullet/problem?

### EHR-specific behavior
7. For non-Athena EHRs, what is the exact “separate note” structure for ICD codes (payload shape and UI)?
8. If ICD markers appear outside Assessment, do we:
   - silently discard,
   - warn the user,
   - or auto-move them into the correct section?

### Mobile behavior
9. iOS/Android: how is bracket-to-widget conversion handled given “no editing” on mobile today?

