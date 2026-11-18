# RescueRoom Quality Assurance & Verification Evidence Catalog

This catalog documents the automated verification runs, security audits, accessibility scans, performance benchmarks, and regression suites conducted across Stages 1 through 5 of the RescueRoom project.

---

## 1. Regression & Integration Test Reports

| Evidence Artifact | Stage | Purpose & Test Scope | Key Metrics / Verdict |
| :--- | :---: | :--- | :--- |
| [`stage5_regression_report.json`](file:///d:/RescueRoom/docs/evidence/stage5_regression_report.json) | Stage 5 | Full end-to-end regression across all 6 routes and 9 primary user journeys. | **19 / 19 PASSED (100%)** |
| [`stage4_a11y_report.json`](file:///d:/RescueRoom/docs/evidence/stage4_a11y_report.json) | Stage 4 | Axe-core automated WCAG 2.1 AA accessibility audit across all interactive elements. | **197 Checks Passed, 0 Violations, 100% Touch Targets $\ge 44\times 44\text{px}$** |
| [`stage4_cross_browser_report.json`](file:///d:/RescueRoom/docs/evidence/stage4_cross_browser_report.json) | Stage 4 | Viewport matrix across desktop, tablet, and mobile (320px–1920px) orientations. | **144 Viewport Combinations Passed (0 horizontal overflows)** |
| [`stage4_perf_reliability_report.json`](file:///d:/RescueRoom/docs/evidence/stage4_perf_reliability_report.json) | Stage 4 | Core Web Vitals (LCP, CLS, INP, TTFB) and memory leak monitoring over 10 route transitions. | **LCP $\le 0.81\text{s}$, CLS $\le 0.011$, Net Heap Delta $+1.7\text{MB}$** |
| [`stage4_digital_twin_perf_report.json`](file:///d:/RescueRoom/docs/evidence/stage4_digital_twin_perf_report.json) | Stage 4 | 3D WebGL frame rate sampling over 180 continuous animation frames. | **Average 58.7 FPS, 0 context crashes** |
| [`stage4_webrtc_report.json`](file:///d:/RescueRoom/docs/evidence/stage4_webrtc_report.json) | Stage 4 | Kinetic escalation verification (Chat $\to$ Voice $\to$ Video $\to$ Chat) and chunk lazy loading. | **Escalation ladder verified; non-blocking system announcements** |
| [`browser_qa_report.json`](file:///d:/RescueRoom/docs/evidence/browser_qa_report.json) | Stage 3 | Route rendering, button states, form validation, and layout responsiveness. | **All 6 routes verified** |

---

## 2. Test Execution Scripts (`scratch/`)

The test harnesses that produced these evidence reports reside in [`scratch/`](file:///d:/RescueRoom/scratch):

- `scratch/stage5_full_regression.mjs`: Complete multi-tenant regression harness.
- `scratch/stage4_a11y_axe_audit.mjs`: Axe-core automated WCAG 2.1 AA evaluation engine.
- `scratch/stage4_cross_browser_responsive.mjs`: Responsive layout and overflow checker.
- `scratch/stage4_perf_reliability.mjs`: Core Web Vitals and heap memory sampler.
- `scratch/stage4_digital_twin_webgl_perf.mjs`: Three.js FPS profiler over 180 continuous frames.
- `scratch/stage4_webrtc_audio_video.mjs`: WebRTC calling and lazy-chunk loader.
- `scratch/run_stage1_security_verification.mjs`: Anti-impersonation, tenant isolation, and session tests.
- `scratch/test_stage2_staging_deployment.mjs`: Dual-stack staging deployment smoke test.

---

## 3. Visual Screenshots Catalog (`scratch/screenshots/`)

Visual evidence screenshots captured via Chrome DevTools Protocol are stored in [`scratch/screenshots/`](file:///d:/RescueRoom/scratch/screenshots):

- `01_login_desktop_1440.png`: Roster selection gate on desktop.
- `02_login_mobile_375.png`: Mobile login layout.
- `03_operator_desktop_1440.png`: Operator emergency station.
- `04_operator_form_opened_desktop.png`: Emergency dispatch requisition form.
- `05_operator_tablet_768.png` & `06_operator_mobile_375.png`: Responsive operator console.
- `08_triage_board_desktop_1440.png`: Triage Kanban board with live counters.
- `10_digital_twin_stage01_overview.png` through `11_digital_twin_stage06_resolution.png`: Complete 6-stage 3D mechanical narrative.
- `12_digital_twin_cad_wireframe_mode.png`: Custom CAD wireframe shader visualization.
- `13_digital_twin_xray_ghost_mode.png`: X-ray ghost shader visualization.
- `16_room_incident_desktop.png`: 3-panel command layout in Incident Room.
- `17_service_report_desktop.png`: FORM-RR-808 forensic service sheet.
- `staging_*_verified.png`: Live staging verification captures on HTTP/HTTPS.

