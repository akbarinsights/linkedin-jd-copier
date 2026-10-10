// ==UserScript==
// @name         LinkedIn - Copy the JD
// @namespace    local.linkedin-jd-copier
// @version      1.0.1
// @license      MIT
// @copyright    2026 Shaik Akbar
// @description  Copy the selected job description, title, company and clean URL. Local only.
// @match        https://www.linkedin.com/*
// @match        https://linkedin.com/*
// @match        https://*.linkedin.com/*
// @run-at       document-idle
// @noframes
// @grant        GM_setClipboard
// @grant        GM.setClipboard
// ==/UserScript==
/*
MIT License

Copyright (c) 2026 Shaik Akbar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(() => {
  function createCopier(env = globalThis) {
    const doc = env.document;
    const HOST = "linkedin-jd-copier";
    const compact = (s) => (s || "").replace(/\s+/g, " ").trim();
    const clean = (s) => s.replace(/\u00a0/g, " ").split("\n").map((line) => (line.match(/^( +)(?=(?:- |\d+\. ))/)?.[1] || "") + line.trim().replace(/[ \t]+/g, " ")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    const jobId = (value) => {
      try {
        const u = new URL(value, env.location.href);
        const q = u.searchParams.get("currentJobId");
        return /^\d+$/.test(q || "") && q || u.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)(?:\/|$)/)?.[1] || "";
      } catch {
        return "";
      }
    };
    const onLinkedIn = () => /(^|\.)linkedin\.com$/i.test(env.location.hostname) && env.location.protocol === "https:";
    const onJobs = () => onLinkedIn() && /^\/jobs(?:\/|$)/.test(env.location.pathname);
    const shown = (el) => {
      for (let p = el; p && p.nodeType === 1; p = p.parentElement) {
        if (p.hidden || p.getAttribute("aria-hidden") === "true") return false;
        const style = env.getComputedStyle(p);
        if (style.display === "none" || style.visibility === "hidden") return false;
      }
      return true;
    };
    const before = (a, b) => !!(a.compareDocumentPosition(b) & 4);
    const all = (root, selector) => [...root.querySelectorAll(selector)];
    const headings = 'h1,h2,h3,h4,[role="heading"]';
    const about = (el) => /^about (?:the )?job$/i.test(compact(el.textContent));
    const skip = 'script,style,noscript,template,button,svg,img,input,select,textarea,[role="button"],[hidden],[aria-hidden="true"],#' + HOST;
    function textFrom(root) {
      function walk(node, depth = 0) {
        if (node.nodeType === 3) return node.nodeValue.replace(/\s+/g, " ");
        if (node.nodeType !== 1 && node.nodeType !== 11) return "";
        if (node.nodeType === 1 && (node.matches(skip) || node.style.display === "none" || node.style.visibility === "hidden" || node.matches(headings) && about(node))) return "";
        const tag = node.tagName;
        if (tag === "BR") return "\n";
        if (tag === "UL" || tag === "OL") {
          let count = Number(node.getAttribute("start")) || 1;
          return "\n" + [...node.children].filter((li) => !li.matches(skip) && li.style.display !== "none" && li.style.visibility !== "hidden").map((li) => {
            const marker = tag === "OL" ? String(count++) + ". " : "- ";
            return "  ".repeat(depth) + marker + [...li.childNodes].map((n) => walk(n, depth + 1)).join("").trim() + "\n";
          }).join("") + "\n";
        }
        const body = [...node.childNodes].map((n) => walk(n, depth)).join("");
        return /^(P|DIV|SECTION|ARTICLE|H[1-6]|BLOCKQUOTE|PRE|TR|DL|DT|DD)$/.test(tag) ? "\n\n" + body + "\n\n" : body;
      }
      return clean(walk(root));
    }
    function findDescription(id) {
      const modern = all(doc, '[id^="JobDetails_AboutTheJob_"]').filter(shown);
      if (modern.length) {
        const matches = modern.filter((x) => !id || x.id === "JobDetails_AboutTheJob_" + id);
        if (matches.length !== 1) throw Error("The selected job is still loading. Wait for its description, then retry.");
        const section = matches[0];
        return { section, root: section.querySelector('[data-testid="expandable-text-box"]') || section, id: section.id.replace("JobDetails_AboutTheJob_", "") };
      }
      const legacy = all(doc, "#job-details,.jobs-description__content,.description__text").filter(shown);
      const roots = legacy.filter((x) => !legacy.some((y) => x !== y && x.contains(y)));
      if (roots.length > 1) throw Error("More than one job description is visible. Open the job in its own tab.");
      if (roots.length === 1) return { section: roots[0], root: roots[0].querySelector(".show-more-less-html__markup,.jobs-box__html-content") || roots[0], id: "" };
      const hs = all(doc, headings).filter((x) => shown(x) && about(x));
      if (hs.length !== 1) throw Error("No unambiguous job description found. Open a job and let it finish loading.");
      const h = hs[0];
      for (let p = h.parentElement; p && !p.matches("main,body"); p = p.parentElement) {
        const other = all(p, headings).filter((x) => x !== h && /^(about the company|similar jobs|people you can reach out to)$/i.test(compact(x.textContent)));
        if (other.length) break;
        if (textFrom(p).length > 80) return { section: p, root: p, id: "" };
      }
      throw Error("This LinkedIn layout is not recognised. Nothing was copied.");
    }
    function extract() {
      if (!onJobs()) throw Error("Open a LinkedIn job page first.");
      const requested = jobId(env.location.href);
      const desc = findDescription(requested);
      let pane = desc.section.closest('[data-sdui-screen$="SemanticJobDetails"],.jobs-search__job-details--container,.jobs-search__job-details,.job-view-layout,.job-view-layout__row,.details');
      if (!pane) {
        for (let p = desc.section.parentElement; p; p = p.parentElement) {
          if (p.matches("body") || p.matches("main") && !/\/jobs\/view\//.test(env.location.pathname)) break;
          const title2 = all(p, 'h1,.top-card-layout__title,a[href*="/jobs/view/"]').find((x) => shown(x) && before(x, desc.section) && !x.closest('aside,nav,[componentkey^="job-card"],.jobs-search-results-list'));
          if (title2) {
            pane = p;
            break;
          }
          if (p.matches("main,body")) break;
        }
      }
      if (!pane) throw Error("The job title is not ready. Open the job in its own tab and retry.");
      const links = all(pane, 'a[href*="/jobs/view/"]').filter((x) => shown(x) && before(x, desc.section) && compact(x.textContent));
      const link = links.find((x) => jobId(x.href) === (requested || desc.id)) || links[0];
      const linkedId = link && jobId(link.href);
      if (requested && linkedId && requested !== linkedId || desc.id && linkedId && desc.id !== linkedId) throw Error("The job changed and is still loading. Nothing was copied.");
      const id = requested || desc.id || linkedId;
      if (!id) throw Error("Cannot verify the selected job ID. Open the job in its own tab.");
      const titleEl = link || all(pane, "h1,.top-card-layout__title,.job-details-jobs-unified-top-card__job-title").find((x) => shown(x) && before(x, desc.section) && !x.closest('aside,nav,[componentkey^="job-card"],.jobs-search-results-list'));
      const title = compact(titleEl?.textContent);
      if (!title) throw Error("No job title found. Nothing was copied.");
      const companyEl = all(pane, 'a[href*="/company/"],.topcard__org-name-link,.job-details-jobs-unified-top-card__company-name').find((x) => shown(x) && before(x, desc.section) && compact(x.textContent));
      const company = compact(companyEl?.textContent);
      let location = compact(pane.querySelector(".topcard__flavor--bullet,.job-details-jobs-unified-top-card__primary-description-container .tvm__text--low-emphasis")?.textContent);
      if (!location && titleEl) {
        let header = titleEl.parentElement;
        while (header && header !== pane && !header.querySelector('a[href*="/company/"]')) header = header.parentElement;
        if (header && header !== pane) {
          const row = all(header, "p").find((p) => before(titleEl, p) && !p.contains(titleEl) && compact(p.textContent).includes("\xB7"));
          if (row) location = compact(row.textContent).split("\xB7")[0].trim();
        }
      }
      const description = textFrom(desc.root);
      if (description.length < 80 || !/[a-zA-Z\u00c0-\uffff]/.test(description)) throw Error("The description is empty or still loading. Nothing was copied.");
      if (desc.section.closest('[aria-busy="true"]') || desc.section.querySelector('[aria-busy="true"],[role="progressbar"]')) throw Error("The description is still loading. Nothing was copied.");
      const url = "https://www.linkedin.com/jobs/view/" + id + "/";
      const markdown = ["# " + title, company && "Company: " + company, location && "Location: " + location, "URL: " + url, "## Job description", description].filter(Boolean).join("\n\n");
      return { id, title, company, location, url, description, markdown };
    }
    let host, shadow, button, status, observer, timer, feedbackTimer, busy = false;
    function say(message) {
      if (status) status.textContent = message;
    }
    function mount() {
      if (host?.isConnected) return;
      if (doc.getElementById(HOST)) return;
      host = doc.createElement("div");
      host.id = HOST;
      host.style.cssText = "position:fixed!important;right:18px!important;bottom:64px!important;z-index:2147483647!important;display:block!important;font:14px/1.45 system-ui,sans-serif!important;";
      shadow = host.attachShadow({ mode: "open" });
      const style = doc.createElement("style");
      style.textContent = ":host{font:14px/1.45 system-ui,sans-serif;color-scheme:light dark}button{font:inherit;cursor:pointer;border:1px solid #155b98;border-radius:8px;background:#0759a8;color:white;padding:10px 16px;font-weight:650;box-shadow:0 2px 10px #0003}button:hover{background:#06447e}button:focus-visible{outline:3px solid #e5ac12;outline-offset:3px}button:disabled{opacity:.65;cursor:wait}.status{max-width:290px;background:Canvas;color:CanvasText;border-radius:6px;padding:6px 9px;margin-top:5px;box-shadow:0 1px 5px #0002}.status:empty{display:none}.panel{position:fixed;inset:12vh 5vw auto;max-width:760px;margin:auto;background:Canvas;color:CanvasText;border:2px solid #0759a8;border-radius:12px;padding:18px;box-shadow:0 10px 40px #0006;max-height:75vh;overflow:auto}textarea{box-sizing:border-box;width:100%;height:40vh;font:13px/1.5 monospace;margin:12px 0;color:CanvasText;background:Canvas}.actions{display:flex;gap:10px}";
      button = doc.createElement("button");
      button.type = "button";
      button.textContent = "Copy the JD";
      button.title = "Copy only the selected job, with title, company and clean link";
      button.addEventListener("click", copy);
      status = doc.createElement("div");
      status.className = "status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      shadow.append(style, button, status);
      doc.documentElement.append(host);
    }
    function manual(text) {
      shadow.querySelector(".panel")?.remove();
      const previous = shadow.activeElement || doc.activeElement;
      const panel = doc.createElement("section");
      panel.className = "panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Copy job description manually");
      const note = doc.createElement("p");
      note.textContent = "Automatic clipboard access was blocked. The JD is selected below. Press Ctrl+C (Mac: Command+C), then Close.";
      const area = doc.createElement("textarea");
      area.readOnly = true;
      area.value = text;
      area.setAttribute("aria-label", "Selected job description");
      const controls = doc.createElement("div");
      controls.className = "actions";
      const select = doc.createElement("button");
      select.textContent = "Select all";
      select.onclick = () => {
        area.focus();
        area.select();
      };
      const close = doc.createElement("button");
      close.textContent = "Close";
      const dismiss = () => {
        panel.remove();
        previous?.focus?.();
      };
      close.onclick = dismiss;
      panel.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          dismiss();
        }
      });
      controls.append(select, close);
      panel.append(note, area, controls);
      shadow.append(panel);
      area.focus();
      area.select();
    }
    function legacyCopy(text) {
      const active = shadow.activeElement || doc.activeElement;
      const selection = env.getSelection();
      const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : [];
      const area = doc.createElement("textarea");
      area.value = text;
      area.setAttribute("aria-label", "Clipboard helper");
      area.style.cssText = "position:fixed;top:0;left:-9999px;";
      shadow.append(area);
      area.focus();
      area.select();
      let ok = false;
      try {
        ok = !!doc.execCommand?.("copy");
      } catch {
      }
      area.remove();
      active?.focus?.();
      if (selection) {
        selection.removeAllRanges();
        ranges.forEach((r) => selection.addRange(r));
      }
      return ok;
    }
    async function writeClipboard(text) {
      if (typeof env.GM_setClipboard === "function") {
        try {
          await env.GM_setClipboard(text, "text");
          return "userscript";
        } catch {
        }
      }
      if (typeof env.GM?.setClipboard === "function") {
        try {
          await env.GM.setClipboard(text, "text");
          return "userscript";
        } catch {
        }
      }
      try {
        if (env.navigator.clipboard?.writeText) {
          await env.navigator.clipboard.writeText(text);
          return "native";
        }
      } catch {
      }
      return legacyCopy(text) ? "legacy" : "manual";
    }
    async function copy() {
      if (busy) return;
      mount();
      if (!button) return;
      busy = true;
      button.disabled = true;
      env.clearTimeout(feedbackTimer);
      say("");
      try {
        const data = extract();
        const method = await writeClipboard(data.markdown);
        if (method === "manual") {
          manual(data.markdown);
          button.textContent = "Copy the JD";
          say("Clipboard blocked. Use the selected text.");
        } else {
          button.textContent = "Copied";
          say(data.title);
          feedbackTimer = env.setTimeout(() => {
            button.textContent = "Copy the JD";
            say("");
          }, 2200);
        }
        return { method, data };
      } catch (error) {
        button.textContent = "Copy the JD";
        say(error.message);
        return { error: error.message };
      } finally {
        busy = false;
        button.disabled = false;
      }
    }
    function update() {
      if (onJobs()) {
        mount();
        if (host) host.style.setProperty("display", "block", "important");
      } else if (host) host.style.setProperty("display", "none", "important");
    }
    function schedule() {
      env.clearTimeout(timer);
      timer = env.setTimeout(update, 150);
    }
    function start() {
      if (!onLinkedIn()) return;
      update();
      if (!observer) {
        observer = new env.MutationObserver((records) => {
          if (records.some((r) => r.target !== host && !host?.contains(r.target))) schedule();
        });
        observer.observe(doc.documentElement, { childList: true, subtree: true });
        env.addEventListener("popstate", schedule);
        env.addEventListener("hashchange", schedule);
      }
    }
    function destroy() {
      observer?.disconnect();
      observer = null;
      env.clearTimeout(timer);
      env.clearTimeout(feedbackTimer);
      env.removeEventListener("popstate", schedule);
      env.removeEventListener("hashchange", schedule);
      host?.remove();
      host = null;
    }
    return { extract, textFrom, copy, start, destroy };
  }
  const key = "__linkedinJDCopier_v1";
  if (!globalThis[key]) {
    globalThis[key] = createCopier();
    globalThis[key].start();
  }
})();
