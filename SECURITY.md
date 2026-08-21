# Security and privacy

## Supported version

Security fixes are applied to the latest release.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository. Do not publish exploit details, private listing data, credentials, or client photos in a public issue.

## Privacy boundary

Manual editing in `web/` does not upload photos or form data and contains no analytics or remote assets. Network access is isolated in `web/mls.js`, disabled until the user explicitly connects, and restricted to `localhost`, `127.0.0.1`, or `::1`.

## Authorized MLS connector

`realtor-poster-mls` is a loopback-only bridge for an operator-approved official or contractual provider endpoint:

- it binds to `127.0.0.1`, accepts only local editor origins, and sends `Cache-Control: no-store`;
- the upstream endpoint is fixed at process start and must use HTTPS, preventing the browser from selecting arbitrary network targets;
- provider authorization is read from a named environment variable and is never returned to the browser, stored in the repository, placed in a project/manifest, or written to request logs;
- request bodies, MLS numbers, authorization headers, and provider responses are not logged;
- the public GitHub Pages editor cannot securely call a plain-HTTP loopback connector, so authorized use requires serving the editor locally (or a separately secured loopback HTTPS deployment);
- synthetic fixtures contain no real records or permission grants and must never be replaced with production credentials or listing data.

The connector does not obtain data rights, scrape pages, reuse other users' credentials, bypass provider controls, or make a listing publishable. Operators remain responsible for provider terms, board rules, image licences, retention, disclosure, and human review.
