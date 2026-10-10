const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
const header = `// ==UserScript==
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
`;
const source = fs.readFileSync(path.join(root, 'copy-jd.js'), 'utf8');
const licence = '/*\n' + fs.readFileSync(path.join(root, 'LICENSE'), 'utf8').trim() + '\n*/\n';
async function bundle(tail, minify) {
  return (await esbuild.transform(source.replace('export function createCopier', 'function createCopier') + '\n' + tail, {minify, format:'iife', target:['chrome109','edge109','firefox115'], legalComments:'none'})).code;
}
(async()=>{ const setup = 'const key="__linkedinJDCopier_v1";';
const userscript = await bundle(`${setup} if (!globalThis[key]) { globalThis[key] = createCopier(); globalThis[key].start(); }`, false);
const bookmark = await bundle(`const existing=document.getElementById("linkedin-jd-copier")?.shadowRoot?.querySelector("button"); if(existing){existing.click();}else{${setup} globalThis[key] ||= createCopier(); globalThis[key].copy();}`, true);
fs.writeFileSync(path.join(root, 'linkedin-copy-jd.user.js'), header + licence + userscript);
const url = 'javascript:void ' + encodeURIComponent(licence + bookmark.trim());
fs.writeFileSync(path.join(root, 'bookmarklet.txt'), url + '\n');
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
fs.writeFileSync(path.join(root, 'install.html'), `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Copy the JD | Install</title>
<style>body{font:17px/1.6 system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#162331;background:#f6f8fb}h1{font-size:38px;letter-spacing:-1px;margin-bottom:8px}h2{margin-top:36px}a{color:#0759a8}section{background:white;border:1px solid #d7e0e9;border-radius:12px;padding:16px 26px;margin:24px 0}#bookmark{display:inline-block;padding:12px 22px;background:#0759a8;color:white;border-radius:8px;text-decoration:none;font-weight:650}code{font-size:14px}textarea{box-sizing:border-box;width:100%;height:120px;font:12px/1.4 monospace}small{color:#4c5f70}</style>
<h1>Copy the JD</h1><p>One selected LinkedIn job. Clean text, paragraphs and bullets. Nothing uploaded.</p>
<section><h2>Recommended: persistent button</h2><ol><li>Install Tampermonkey from your browser's official extension store (Chrome, Edge or Firefox).</li><li>Open its dashboard and choose <b>Create a new script</b>.</li><li>Replace the template with all of <a href="linkedin-copy-jd.user.js" download>linkedin-copy-jd.user.js</a>, then save.</li><li>Allow the manager to run on LinkedIn. If Chrome/Edge asks for <b>Allow User Scripts</b>, enable it for the manager. Older versions may require Developer mode.</li><li>Reload LinkedIn. Open a job and click <b>Copy the JD</b> at bottom-right.</li></ol><p>Matching LinkedIn pages includes the feed so navigating from the feed into Jobs works without a reload. The button is shown only on Jobs pages.</p></section>
<section><h2>No extension: bookmarklet</h2><p>Show the bookmarks bar, then drag this link onto it:</p><p><a id="bookmark" href="${esc(url)}">Copy the JD</a></p><p>Open a LinkedIn job, then click the bookmark. It copies the selected job immediately. If clipboard access is blocked, a text box opens for Ctrl+C (Mac: Command+C).</p><p>Can't drag? Create a bookmark, name it <b>Copy the JD</b>, and paste the complete one-line code below into its URL/Location field.</p><textarea aria-label="Bookmarklet URL" readonly>${esc(url)}</textarea><p><small>Paste into a bookmark's URL field, not the address bar. The code is self-contained and makes no network requests. Browser policy or site security can block bookmarklets.</small></p></section>
<p>Unknown layout or loading job? The tool reports an error rather than copying the entire page. English heading fallback; other UI languages rely on recognised structural selectors.</p><p><a href="LICENSE">MIT License</a> · <a href="README.md">Full instructions and limitations</a> · <a href="VERIFICATION.md">What was actually tested</a></p></html>`);
const report = {version:'1.0.1', userscriptBytes:Buffer.byteLength(header+licence+userscript), bookmarkletBytes:Buffer.byteLength(url), targets:['Chrome 109+','Edge 109+','Firefox 115+'], runtimeDependencies:0};
fs.writeFileSync(path.join(root, 'evidence/build.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

})().catch(e=>{console.error(e);process.exitCode=1});
