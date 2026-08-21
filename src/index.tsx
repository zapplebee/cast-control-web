/** @jsxImportSource hono/jsx */
import { Hono } from "hono";

const castMcpUrl = process.env.CAST_MCP_URL ?? "http://172.22.0.1:4130";
const castMcpToken = process.env.CONTROL_AUTH_TOKEN ?? process.env.CAST_MCP_TOKEN;
const defaultBookId = process.env.STORYTIME_BOOK_ID ?? "project-hail-mary";
const defaultDurationSeconds = Number(process.env.STORYTIME_DURATION_SECONDS ?? "600");

const app = new Hono();

app.get("/", (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Cast Control</title>
        <style>{styles}</style>
      </head>
      <body>
        <main class="page">
          <section class="sheet" aria-label="Cast controls">
            <p class="eyebrow">cast control / local only</p>
            <h1>Storytime controls.</h1>
            <p class="lede">
              Choose a speaker and a book, then start storytime or send a quick spoken message.
            </p>

            <div class="rule" />

            <div id="cast-app" class="widget-shell">
              <p>Cast controls loading...</p>
            </div>
          </section>
        </main>
        <script type="module" src="/client.js" />
      </body>
    </html>,
  );
});

app.get("/client.js", async (c) => {
  return c.body(await Bun.file("./public/client.js").text(), 200, {
    "content-type": "application/javascript; charset=utf-8",
  });
});

app.get("/api/speakers", async (c) => c.json(await castGet("/speakers")));
app.get("/api/books", async (c) => c.json(await castGet("/books")));

app.post("/api/play", async (c) => {
  const body = await c.req.json();
  return c.json(
    await castPost("/play", {
      speakerId: String(body.speakerId ?? ""),
      bookId: String(body.bookId ?? defaultBookId),
      durationSeconds: Number(body.durationSeconds ?? defaultDurationSeconds),
    }),
  );
});

app.post("/api/say", async (c) => {
  const body = await c.req.json();
  return c.json(
    await castPost("/say", {
      speakerId: String(body.speakerId ?? ""),
      text: String(body.text ?? ""),
    }),
  );
});

app.get("/health", (c) => c.json({ ok: true }));

Bun.serve({ fetch: app.fetch, hostname: "0.0.0.0", port: 3000 });
console.log("cast-control-web listening on 0.0.0.0:3000");

async function castGet(path: string) {
  const response = await fetch(`${castMcpUrl}${path}`, { headers: authHeaders() });
  return parseCastResponse(response);
}

async function castPost(path: string, body: unknown) {
  const response = await fetch(`${castMcpUrl}${path}`, {
    method: "POST",
    headers: { ...authHeaders(), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseCastResponse(response);
}

async function parseCastResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.error ?? `cast-mcp returned ${response.status}`);
  return data;
}

function authHeaders() {
  if (!castMcpToken) throw new Error("Missing CONTROL_AUTH_TOKEN or CAST_MCP_TOKEN");
  return { authorization: `Bearer ${castMcpToken}` };
}

const styles = `
  :root {
    color-scheme: light;
    --paper: #fbf8ef;
    --paper-deep: #efe6d1;
    --ink: #071a33;
    --ink-soft: #263d5e;
    --line: #092345;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    min-height: 100vh;
    color: var(--ink);
    background:
      linear-gradient(90deg, rgba(7, 26, 51, 0.045) 1px, transparent 1px),
      linear-gradient(rgba(7, 26, 51, 0.045) 1px, transparent 1px),
      var(--paper);
    background-size: 32px 32px;
    font-family: Georgia, "Times New Roman", serif;
  }

  .page { min-height: 100vh; display: grid; place-items: center; padding: 32px; }

  .sheet {
    width: min(920px, 100%);
    padding: clamp(28px, 6vw, 72px);
    background: var(--paper);
    border: 3px solid var(--line);
    box-shadow: 14px 14px 0 var(--line);
  }

  .eyebrow {
    margin: 0 0 22px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.78rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  h1 { max-width: 780px; margin: 0; font-size: clamp(3rem, 9vw, 7.8rem); line-height: 0.86; letter-spacing: -0.075em; }
  .lede { max-width: 660px; margin: 28px 0 0; color: var(--ink-soft); font-size: clamp(1.1rem, 2vw, 1.45rem); line-height: 1.45; }
  .lede strong { color: var(--ink); }
  .rule { height: 3px; margin: 42px 0 24px; background: var(--line); }

  .widget-shell {
    margin-top: 24px;
    padding: 18px;
    border: 2px solid var(--line);
    background: var(--paper-deep);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .control-grid { display: grid; grid-template-columns: 1.2fr 1.6fr 0.9fr; gap: 14px; margin-bottom: 18px; }
  label { display: grid; gap: 8px; }
  label span { font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; }

  button, textarea, select { font: inherit; }

  select {
    width: 100%;
    color: var(--ink);
    background: var(--paper);
    border: 2px solid var(--line);
    padding: 12px 14px;
  }

  select:focus { outline: none; box-shadow: 4px 4px 0 var(--line); }

  button {
    color: var(--paper);
    background: var(--ink);
    border: 2px solid var(--ink);
    padding: 12px 16px;
    cursor: pointer;
  }

  button:hover,
  button:focus-visible {
    color: var(--ink);
    background: var(--paper);
    outline: none;
  }

  button:disabled { cursor: not-allowed; opacity: 0.6; }

  .big-play {
    width: 100%;
    margin-bottom: 18px;
    padding: clamp(28px, 7vw, 56px) 18px;
    font-size: clamp(1.6rem, 5vw, 3.8rem);
    font-weight: 800;
    letter-spacing: -0.06em;
  }

  .say-box { display: grid; gap: 12px; }
  textarea { width: 100%; min-height: 120px; resize: vertical; padding: 14px; color: var(--ink); background: var(--paper); border: 2px solid var(--line); }
  textarea:focus { outline: none; box-shadow: 4px 4px 0 var(--line); }
  .say-button { justify-self: end; min-width: 160px; }
  .status { min-height: 24px; margin: 16px 0 0; color: var(--ink-soft); }
  .status.error { color: #8a1f16; }

  @media (max-width: 720px) {
    .page { padding: 18px; }
    .sheet { box-shadow: 8px 8px 0 var(--line); }
    .control-grid { grid-template-columns: 1fr; }
    .say-button { width: 100%; }
  }
`;
