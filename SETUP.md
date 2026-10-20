# Setup Checklist

This project is delivered in stages so beginners can see the site before cloud setup.

## 1. Local Preview

- Build locally with `node scripts/site.js build --cwd <project>`.
- Start preview with `node scripts/site.js preview:start --cwd <project> --mode vite`.
- Keep the preview running until a public URL is verified.

## 2. Database Activation

Use this only when the site needs real products, inventory, orders, auth, or user-owned data.

Run `skills/supabase-backend/SKILL.md` to select the provider. When it selects `polardb_supabase`, load and follow `skills/polardb-supabase-backend/SKILL.md`; that owner Skill is the only source for PolarDB setup and operation rules.

For an existing or explicitly selected Supabase Cloud project, preserve that provider. Check `accio-mcp-cli server tools supabase --raw`; if connected, invoke its tools with `accio-mcp-cli call --server supabase <tool>`. If disconnected, ask the user to connect Supabase in the Accio Site Builder plugin.

Never paste `SUPABASE_SERVICE_ROLE_KEY`, database passwords, connection strings, or account access tokens in chat.

## 3. Commerce Requests

This plugin does not generate online payment, cart, checkout, or payment placeholder flows. For commerce-shaped sites, use product/service display, inquiry forms, booking requests, or off-site contact links.

## 4. Site Publish

Two equivalent ways to get a public URL:

- The user clicks the product UI publish button.
- When host builtin `web_builder_publish` is visible/available, the agent asks for explicit consent, then publishes and reports the public URL.

Keep the local preview running until the public URL is verified.

Company-domain subdomains from site publish are supported. Binding a user's own domain is not supported yet. If asked to bind their own domain, do not guide DNS/CNAME setup; say that feature is in development and coming later.

## Completion

Final handoff should include either a public URL, a still-running local preview URL, or a blocker plus the exact next action. Format a local preview URL according to `skills/react-local-runtime/SKILL.md` so its link text matches the user's current conversation language and has no preceding label.
