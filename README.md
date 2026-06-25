# Outreach.ai

A managed, multi-tenant **AI calling service — inbound and outbound**. Any business signs up;
our AI voice agent makes their outbound calls (qualify + book meetings) and answers their inbound
calls after-hours (converse + book). One engine, each client a settings row — never code per client.

We're **tenant 0**: our own first customer, using the service to reach insurance brokers.
Brokers are the first vertical, not the product.

## Docs
- [Build plan](docs/build-plan.md) — full design & decisions
- [Progress & tasks](docs/PROGRESS.md) — what's built, what's next
- [Onboarding checklist](docs/onboarding-checklist.md) — every per-account field to fill
- [Flow](docs/flow.html) — visual diagrams (open in a browser)

## The shape
Four input pipes (CSV upload · inbound call · web-form · scraping) → one engine
(qualify → book → notify) → meeting on the client's calendar. Scraping is one optional B2B pipe,
not the spine.

## Repo
- `src/` — engine code
- `scripts/` — runnable jobs + diagnostics
- `docs/` — planning
- `sync.bat` — double-click to pull → commit → push
