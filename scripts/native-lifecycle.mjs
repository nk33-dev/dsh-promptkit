import { connect } from "./cdp.mjs";
import { writeFile } from "node:fs/promises";
const page = await connect(),
  report = { version: "0.1.3", checks: [], errors: [] };
const assert = (v, m) => {
  if (!v) throw Error(m);
  report.checks.push(m);
};
async function wait(expression) {
  for (let i = 0; i < 180; i++) {
    const v = await page.evaluate(expression);
    if (v) return v;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw Error("Lifecycle wait: " + expression);
}
async function click(selector, text) {
  await wait(
    `[...document.querySelectorAll(${JSON.stringify(selector)})].some(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled)`,
  );
  await page.evaluate(
    `(()=>{[...document.querySelectorAll(${JSON.stringify(selector)})].find(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled).click();return true})()`,
  );
}
async function label(label) {
  await wait(
    `[...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')===${JSON.stringify(label)}&&!b.disabled)`,
  );
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===${JSON.stringify(label)}&&!b.disabled).click();return true})()`,
  );
}
try {
  await page.call("Page.enable");
  await wait(`!!document.querySelector('button[aria-label="插件"]')`);
  await label("插件");
  await page.evaluate(
    `(()=>{document.querySelector('button[aria-label="返回插件"]')?.click();return true})()`,
  );
  await label("查看 PromptKit 提示词助手");
  await wait(`document.body.innerText.includes('0.1.3')`);
  assert(true, "Archive version 0.1.3 is installed");
  await label("启用 PromptKit 提示词助手");
  await wait(
    `!document.querySelector('style[data-plugin*=promptkit]')&&[...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')==='启用 PromptKit 提示词助手'&&b.getAttribute('aria-checked')==='false'&&!b.disabled)`,
  );
  assert(true, "Disable removes client styles and contributions");
  await label("启用 PromptKit 提示词助手");
  await wait(
    `!!document.querySelector('style[data-plugin*=promptkit]')&&[...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')==='启用 PromptKit 提示词助手'&&b.getAttribute('aria-checked')==='true'&&!b.disabled)`,
  );
  assert(true, "Enable restores client services");
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||'').startsWith('在')&&(b.getAttribute('aria-label')||'').includes('Codex3N')).click();return true})()`,
  );
  await click(".pk-tools button", "收藏库");
  await wait(
    `document.querySelector('.pk-flyout')?.innerText.includes('PromptKit 验收：快捷收藏')`,
  );
  assert(true, "Favorites survive upgrade, restart and disable/enable");
  await click(".pk-flyout button", "关闭");
  await label("账号菜单");
  await wait(`!!document.querySelector('[role=menuitem]')`);
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.startsWith('设置')).click();return true})()`,
  );
  await click("button", "PromptKit");
  await click(".pk-management [role=tab]", "反馈");
  await wait(
    `document.querySelector('.pk-management').innerText.includes('PromptKit 快捷验收')`,
  );
  assert(true, "Feedback survives upgrade and restart");
  await click(".pk-management [role=tab]", "设置");
  await wait(
    `document.querySelectorAll('.pk-management input[role=switch]').length>=5`,
  );
  for (const label of ["普通改写", "多轮追问", "收藏库"])
    await page.evaluate(
      `(()=>{[...document.querySelectorAll('.pk-management label')].find(l=>l.querySelector('span')?.textContent===${JSON.stringify(label)}).querySelector('input').click();return true})()`,
    );
  await click(".pk-management button", "保存修改");
  await wait(`document.querySelectorAll('.pk-tools>button').length===0`);
  assert(true, "Disabling features updates the mounted composer immediately");
  for (const label of ["普通改写", "多轮追问", "收藏库"])
    await page.evaluate(
      `(()=>{[...document.querySelectorAll('.pk-management label')].find(l=>l.querySelector('span')?.textContent===${JSON.stringify(label)}).querySelector('input').click();return true})()`,
    );
  await click(".pk-management button", "保存修改");
  await wait(`document.querySelectorAll('.pk-tools>button').length===2`);
  assert(true, "Re-enabling features restores composer entries immediately");
  await click("button", "通用设置");
  await click("[role=dialog] button", "浅色");
  await click("[role=dialog] button", "关闭");
  await click(".pk-tools button", "收藏库");
  await wait(`!!document.querySelector('.pk-item')`);
  const clip = await page.evaluate(
    `(()=>{const r=document.querySelector('.pk-flyout').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`,
  );
  await page.screenshot("work/native/quick-library-light.png", clip);
  assert(
    await page.evaluate(
      `getComputedStyle(document.querySelector('.pk-flyout')).backgroundColor!=='rgb(20, 20, 20)'`,
    ),
    "Quick panel follows the light Harness theme",
  );
  await click(".pk-flyout button", "关闭");
  await label("账号菜单");
  await wait(`!!document.querySelector('[role=menuitem]')`);
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.startsWith('设置')).click();return true})()`,
  );
  await click("button", "通用设置");
  await click("[role=dialog] button", "深色");
  await click("[role=dialog] button", "中文");
  await wait(`!!document.querySelector('[role=menu]')`);
  report.languageOptions = await page.evaluate(
    `[...document.querySelectorAll('[role=menuitem]')].map(e=>e.textContent)`,
  );
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.includes('English')).click();return true})()`,
  );
  await click("button", "PromptKit");
  await wait(
    `document.querySelector('.pk-management').innerText.includes('Features')`,
  );
  assert(true, "Management follows the English Harness locale");
  const management = await page.evaluate(
    `(()=>{const r=document.querySelector('.pk-management').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:Math.min(r.height,innerHeight-r.y-5),scale:1}})()`,
  );
  await page.screenshot("work/native/quick-settings-english.png", management);
  await click("button", "General");
  await click("[role=dialog] button", "English");
  await wait(`!!document.querySelector('[role=menu]')`);
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.includes('中文')).click();return true})()`,
  );
  await click("[role=dialog] button", "关闭");
  assert(true, "Restored Chinese and dark theme");
} catch (error) {
  report.errors.push(error.message);
  process.exitCode = 1;
} finally {
  await writeFile(
    "work/native/quick-lifecycle.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  page.close();
}
