import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished moon observation learning app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="ko"/i);
  assert.match(html, /<title>달 관측 기록 복원소<\/title>/i);
  assert.match(html, /앞뒤 관측 기록을 근거로 사라진 달 모양을 복원하는 초등 과학 학습 앱/);
  assert.match(html, /대표 달 모형을 먼저 살펴봐요/);
  assert.match(html, /aria-label="안내 메뉴"/);
  assert.match(html, /업데이트 내역/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site|react-loading-skeleton/i);
});

test("keeps the primary question heading at least 29px", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /h1\s*\{[^}]*font-size:\s*clamp\(29px,\s*4vw,\s*2\.65rem\)/s);
});

test("gives restoration record summaries a 44px touch target", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.result-summary summary\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*44px;[^}]*padding:/s);
});
