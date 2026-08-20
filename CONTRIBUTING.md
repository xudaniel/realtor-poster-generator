# Contributing

Thank you for helping improve Realtor Poster Generator, created by Daniel Xu.

## Development setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python scripts/create_sample_assets.py
python -m unittest discover -s tests -v
node --check web/app.js
```

Run the browser editor with `python scripts/serve_web.py` and open `http://127.0.0.1:8765`.

## Pull requests

- Keep listing examples fictional and never commit client photos or contact information.
- Add tests for behavior changes and visual checks for layout changes.
- Preserve deterministic text rendering: listing facts must come directly from validated input.
- Keep the browser editor dependency-free and browser-local; do not add uploads, analytics, remote fonts, or tracking.
- Update `CHANGELOG.md` and both README files for user-facing changes.
- Confirm generated PDFs remain one page and social exports retain their documented dimensions.

By contributing, you agree that your contribution will be licensed under the MIT License.
