/** @jsxImportSource hono/jsx */
import { useEffect, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";

type Speaker = { id: string; name: string };
type Book = { id: string; title: string; author?: string };

function CastApp() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [speakerId, setSpeakerId] = useState("boys-room-speaker");
  const [bookId, setBookId] = useState("project-hail-mary");
  const [durationSeconds, setDurationSeconds] = useState(1800);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Loading controls...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetchJson<Speaker[]>("/api/speakers"), fetchJson<Book[]>("/api/books")])
      .then(([speakerItems, bookItems]) => {
        setSpeakers(speakerItems);
        setBooks(bookItems);
        if (!speakerItems.some((speaker) => speaker.id === speakerId) && speakerItems[0]) setSpeakerId(speakerItems[0].id);
        if (!bookItems.some((book) => book.id === bookId) && bookItems[0]) setBookId(bookItems[0].id);
        setStatus("Ready.");
      })
      .catch((error) => setStatus(error.message));
  }, []);

  const selectedSpeaker = speakers.find((speaker) => speaker.id === speakerId)?.name ?? speakerId;
  const selectedBook = books.find((book) => book.id === bookId)?.title ?? bookId;

  async function playStory() {
    await runAction(`Playing ${selectedBook} on ${selectedSpeaker}.`, () => postJson("/api/play", { speakerId, bookId, durationSeconds }));
  }

  async function sayMessage() {
    const text = message.trim();
    if (!text) {
      setStatus("Type a message first.");
      return;
    }
    await runAction(`Sent message to ${selectedSpeaker}.`, () => postJson("/api/say", { speakerId, text }));
    setMessage("");
  }

  async function runAction(success: string, action: () => Promise<unknown>) {
    setBusy(true);
    setStatus("Working...");
    try {
      await action();
      setStatus(success);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div class="control-grid">
        <label>
          <span>speaker</span>
          <select value={speakerId} onChange={(event) => setSpeakerId((event.currentTarget as HTMLSelectElement).value)} disabled={busy || speakers.length === 0}>
            {speakers.map((speaker) => (
              <option value={speaker.id}>{speaker.name}</option>
            ))}
          </select>
        </label>

        <label>
          <span>book</span>
          <select value={bookId} onChange={(event) => setBookId((event.currentTarget as HTMLSelectElement).value)} disabled={busy || books.length === 0}>
            {books.map((book) => (
              <option value={book.id}>{book.author ? `${book.title} - ${book.author}` : book.title}</option>
            ))}
          </select>
        </label>

        <label>
          <span>duration</span>
          <select value={String(durationSeconds)} onChange={(event) => setDurationSeconds(Number((event.currentTarget as HTMLSelectElement).value))} disabled={busy}>
            <option value="1800">30m</option>
            <option value="3600">1hr</option>
            <option value="5400">1:30</option>
            <option value="7200">2hr</option>
          </select>
        </label>
      </div>

      <button type="button" class="big-play" onClick={playStory} disabled={busy || !speakerId || !bookId}>
        Play Story
      </button>

      <div class="say-box">
        <textarea value={message} onInput={(event) => setMessage((event.currentTarget as HTMLTextAreaElement).value)} placeholder="Say something on the selected speaker..." />
        <button type="button" class="say-button" onClick={sayMessage} disabled={busy || !speakerId}>
          Say It
        </button>
      </div>

      <p class={status.toLowerCase().includes("error") || status.toLowerCase().includes("failed") ? "status error" : "status"}>{status}</p>
    </div>
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error ?? `Request failed: ${response.status}`);
  return data;
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error ?? `Request failed: ${response.status}`);
  return data;
}

const mount = document.getElementById("cast-app");
if (mount) render(<CastApp />, mount);
