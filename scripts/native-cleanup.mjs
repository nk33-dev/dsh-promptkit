import { connect } from "./cdp.mjs";
import { writeFile } from "node:fs/promises";
const page = await connect(),
  report = { favoritesRemoved: 0, feedbackRemoved: 0, errors: [] };
async function wait(expression) {
  for (let i = 0; i < 150; i++) {
    if (await page.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("Cleanup timeout: " + expression);
}
async function click(selector, text) {
  await wait(
    `[...document.querySelectorAll(${JSON.stringify(selector)})].some(b=>b.textContent.trim()===${JSON.stringify(text)})`,
  );
  await page.evaluate(
    `(()=>{[...document.querySelectorAll(${JSON.stringify(selector)})].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click();return true})()`,
  );
}
async function remove(expression) {
  const at = page.events.length,
    pending = page.evaluate(expression);
  pending.catch(() => {});
  for (let i = 0; i < 150; i++) {
    if (
      page.events
        .slice(at)
        .some((e) => e.method === "Page.javascriptDialogOpening")
    )
      break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await page.call("Page.handleJavaScriptDialog", { accept: true });
  await pending;
}
async function settings() {
  await page.evaluate(
    `(()=>{document.querySelector('button[aria-label="账号菜单"]').click();return true})()`,
  );
  await wait(`!!document.querySelector('[role=menuitem]')`);
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.startsWith('设置')).click();return true})()`,
  );
  await click("button", "PromptKit");
}
try {
  await page.call("Page.enable");
  await settings();
  await click(".pk-management [role=tab]", "收藏库");
  await wait(`!!document.querySelector('.pk-management .pk-item')`);
  const match = `[...document.querySelectorAll('.pk-management .pk-item')].filter(b=>b.querySelector('strong')?.textContent==='PromptKit 验收：快捷收藏'||b.querySelector('strong')?.textContent==='PromptKit 验收：快捷导入')`;
  for (let i = 0; i < 20; i++) {
    const count = await page.evaluate(`${match}.length`);
    if (!count) break;
    await page.evaluate(`(()=>{${match}[0].click();return true})()`);
    await wait(`!!document.querySelector('.pk-management textarea')`);
    await remove(
      `(()=>{[...document.querySelectorAll('.pk-management button')].find(b=>b.textContent==='删除').click();return true})()`,
    );
    await wait(`${match}.length<${count}`);
    report.favoritesRemoved++;
  }
  await click(".pk-management [role=tab]", "反馈");
  await wait(`!!document.querySelector('.pk-management input')`);
  const feedback = `[...document.querySelectorAll('.pk-management details.pk-box')].filter(d=>d.textContent.includes('PromptKit 快捷验收'))`;
  for (let i = 0; i < 20; i++) {
    const count = await page.evaluate(`${feedback}.length`);
    if (!count) break;
    await page.evaluate(`(()=>{${feedback}[0].open=true;return true})()`);
    await remove(
      `(()=>{[...${feedback}[0].querySelectorAll('button')].find(b=>b.textContent==='删除').click();return true})()`,
    );
    await wait(`${feedback}.length<${count}`);
    report.feedbackRemoved++;
  }
  await click("[role=dialog] button", "关闭");
  await page.evaluate(
    `(()=>{const e=document.querySelector('[contenteditable=true]');e.focus();const range=document.createRange();range.selectNodeContents(e);getSelection().removeAllRanges();getSelection().addRange(range);return true})()`,
  );
  await page.call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Backspace",
    code: "Backspace",
    windowsVirtualKeyCode: 8,
  });
  await page.call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Backspace",
    code: "Backspace",
    windowsVirtualKeyCode: 8,
  });
} catch (error) {
  report.errors.push(error.message);
  process.exitCode = 1;
} finally {
  await writeFile(
    "work/native/quick-cleanup.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  page.close();
}
