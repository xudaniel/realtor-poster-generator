# Authorized MLS Connector Protocol

[中文](MLS_CONNECTOR.md) · [English README](../README.en.md) · [Product requirements](../PRD.en.md)

This v2.0 candidate protocol implements [Issue #22](https://github.com/xudaniel/realtor-poster-generator/issues/22). It allows the browser editor to resolve one listing number through a provider or brokerage connector that the user is already authorized to use. It does not scrape listing websites, bypass access controls, or place provider credentials in this repository or GitHub Pages.

## Trust boundary

- Manual editing, rendering, recovery, and export remain on the current device.
- Network access occurs only after the user selects **Authorized connector** and presses **Generate**.
- The editor sends one normalized MLS number to the connector. Authentication must be established outside the editor and represented by a secure connector session cookie.
- The connector owns provider credentials, board membership checks, rate limits, audit logging, field entitlements, and media licensing decisions.
- The editor never accepts an API key or bearer token. Connector URLs containing credentials, query strings, or fragments are rejected.
- Production connectors require HTTPS. Plain HTTP is accepted only for `localhost`, `127.0.0.1`, or `[::1]` development.

The bundled `DEMO1234` provider is a fictional, in-memory fixture. It makes no network request and must not be presented as a real listing.

## Endpoint

The editor sends:

```http
POST /v1/listings:resolve
Content-Type: application/json
Accept: application/json
X-Realtor-Poster-Protocol: 1.0

{"mlsNumber":"C1234567"}
```

The request uses `credentials: include`, `cache: no-store`, `redirect: error`, a 15-second timeout, and no referrer. The connector must apply narrow CORS rules for the editor origin and secure, same-site session-cookie settings appropriate to its deployment.

## Success envelope

```json
{
  "protocolVersion": "1.0",
  "matchCount": 1,
  "retrievedAt": "2026-08-20T20:30:00.000Z",
  "provider": {
    "id": "provider-id",
    "name": "Authorized Provider",
    "board": "Board or MLS system"
  },
  "match": {
    "confirmed": true,
    "keys": {
      "providerId": "provider-id",
      "board": "Board or MLS system",
      "mlsNumber": "C1234567",
      "status": "FOR LEASE",
      "address": "10 Example Street",
      "unit": "1204"
    }
  },
  "listing": {
    "mlsNumber": "C1234567",
    "status": "FOR LEASE",
    "address": "10 Example Street",
    "unit": "1204",
    "city": "Toronto, ON",
    "postalCode": "M5V 0A0",
    "price": "$3,500",
    "rentPeriod": "per month",
    "beds": "2",
    "baths": "2",
    "sqft": "800",
    "headlineEn": "Literal provider text",
    "headlineZh": "",
    "featuresEn": ["Literal feature"],
    "featuresZh": [],
    "leaseDetails": [],
    "includedCosts": [],
    "tenantPaidCosts": []
  },
  "media": [
    {
      "role": "hero",
      "sourceId": "provider-photo-1",
      "name": "hero.jpg",
      "type": "image/jpeg",
      "order": 0,
      "width": 2400,
      "height": 1600,
      "caption": "Provider caption",
      "rights": {
        "exportAllowed": true,
        "basis": "Provider-authorized campaign use",
        "sourceId": "provider-photo-1",
        "confirmedAt": "2026-08-20T20:30:00.000Z"
      },
      "dataUrl": "data:image/jpeg;base64,..."
    }
  ]
}
```

`listing.unit` and all six exact-match keys are required; use an explicit empty string when a unit is not applicable. `matchCount` must be exactly `1`. Supported active statuses are `FOR LEASE`, `FOR SALE`, `JUST LISTED`, and `OPEN HOUSE`. The returned number must equal the normalized requested number.

Permitted images must be supported base64 `data:image/...` values with positive source dimensions and explicit rights basis, source ID, and confirmation time. A response may permit at most one hero, four interiors, and two floor plans; source IDs must be unique, and every floor plan must declare `furnished3d` or `technical2d`. Media without export permission may omit image bytes; it is recorded as blocked and never silently placed on the poster. At most 20 permitted or blocked media records are accepted, and the response body is limited to 12 MiB.

## Error contract

The editor maps these HTTP statuses to bilingual, non-destructive messages:

| HTTP | Meaning |
|---|---|
| `401`, `403` | Connector session is not authorized |
| `404` | Listing not found |
| `409` | More than one listing matched |
| `410` | Listing withdrawn, expired, or unavailable |
| `429` | Provider rate limit reached |
| Other non-2xx | Provider unavailable |

An invalid or oversized response is rejected. The existing editor project is retained on every failure.

## Deterministic mapping and review

- Provider values are copied to the existing project schema without inference, translation, summarization, or rewriting.
- Existing agent, brand, template, theme, and compliance fields are preserved.
- Imported listing/content/module fields retain provider, board, listing number, retrieval time, original value, and any later local override.
- Media retains source ID, order, dimensions, caption, rights basis, and rights-confirmation time.
- A refresh compares incoming values to the current editable project and asks for confirmation before replacement.
- The normal IndexedDB recovery path saves a snapshot before import or refresh and stores the imported project afterward.
- Publication exports are blocked until the user explicitly reviews facts, current status, disclosures, and image rights. Any imported-field or media edit invalidates that review.

## Testing

Tests use only the fictional fixture and mock connector responses:

```bash
node tests/test_web_mls.js
```

Never add real provider credentials, real private listing payloads, or production session material to tests, issues, logs, screenshots, or pull requests.

Copyright © 2026 **Daniel Xu**. Released under the [MIT License](../LICENSE).
