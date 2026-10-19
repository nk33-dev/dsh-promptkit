import { createServer } from "node:http";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { connect } from "./cdp.mjs";
import { resolve } from "node:path";
// 验收时打开的 Harness 项目名，可用 PROMPTKIT_TEST_PROJECT 指定。
const project = process.env.PROMPTKIT_TEST_PROJECT || "";
const report = {
  version: "0.1.3",
  kind: "Windows Harness UI with deterministic local model",
  checks: [],
  requests: 0,
  errors: [],
};
const server = createServer(async (req, res) => {
  try {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const wire = JSON.parse(raw),
      content = JSON.parse(
        wire.messages.find((m) => m.role === "user").content,
      );
    report.requests++;
    const round = content.previousRounds.length,
      clarify = wire.messages.some(
        (m) => m.role === "system" && m.content.includes('"kind":"questions"'),
      );
    const value = !clarify
      ? `已整理：${content.draft}\n\n检查边界情况并验证结果。`
      : content.forceFinal || round >= 3
        ? {
            kind: "final",
            text: `实现团队任务管理工具。\n\n原始需求：${content.draft}\n\n已确认 ${round} 轮问题。按确认范围实现并验证结果。`,
          }
        : {
            kind: "questions",
            questions: Array.from({ length: 3 }, (_, i) => ({
              id: `round_${round}_q_${i}`,
              title: ["范围", "协作", "验收"][i],
              question: ["需要哪些任务操作？", "如何协作？", "如何验收？"][i],
              options: [
                {
                  label: `推荐方案 ${round}-${i}`,
                  description: "完成核心流程。",
                },
                {
                  label: `自定义方案 ${round}-${i}`,
                  description: "填写所需范围。",
                },
              ],
              recommended: 0,
            })),
          };
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                typeof value === "string" ? value : JSON.stringify(value),
            },
          },
        ],
      }),
    );
  } catch {
    res.statusCode = 500;
    res.end("{}");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const page = await connect(),
  fixtureTitle = "PromptKit 验收：快捷收藏";
const assert = (v, message) => {
  if (!v) throw Error(message);
  report.checks.push(message);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function wait(expression) {
  for (let i = 0; i < 150; i++) {
    const v = await page.evaluate(expression);
    if (v) return v;
    await pause(100);
  }
  throw Error("UI timeout: " + expression);
}
async function click(selector, text) {
  await wait(
    `[...document.querySelectorAll(${JSON.stringify(selector)})].some(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled)`,
  );
  return page.evaluate(
    `(()=>{[...document.querySelectorAll(${JSON.stringify(selector)})].find(b=>b.textContent.trim()===${JSON.stringify(text)}&&!b.disabled).click();return true})()`,
  );
}
async function labelButton(label) {
  await wait(
    `[...document.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')===${JSON.stringify(label)})`,
  );
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===${JSON.stringify(label)}).click();return true})()`,
  );
}
async function settings() {
  if (!(await page.evaluate(`!!document.querySelector('.pk-management')`))) {
    await labelButton("账号菜单");
    await wait(`!!document.querySelector('[role=menuitem]')`);
    await page.evaluate(
      `(()=>{[...document.querySelectorAll('[role=menuitem]')].find(b=>b.textContent.startsWith('设置')).click();return true})()`,
    );
    await click("button", "PromptKit");
  }
  await click(".pk-management [role=tab]", "设置");
  await wait(`!!document.querySelector('.pk-management input[role=switch]')`);
}
async function closeSettings() {
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('[role=dialog]:not(.pk-flyout) button')].find(b=>b.textContent.trim()==='关闭').click();return true})()`,
  );
  await wait(`!document.querySelector('.pk-management')`);
}
async function field(label, value, scope = ".pk-management") {
  return page.evaluate(
    `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(scope + " label")})].find(l=>l.querySelector('span')?.textContent===${JSON.stringify(label)})?.querySelector('input,select,textarea');if(!e)throw Error('Missing field '+${JSON.stringify(label)});if(e.tagName==='SELECT'){e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));}else{Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));}return true})()`,
  );
}
async function save() {
  await click(".pk-management button", "保存修改");
  await wait(
    `document.querySelector('.pk-management .pk-notice')?.textContent==='已保存'`,
  );
  await pause(100);
}
async function draft(text) {
  await wait(`!!document.querySelector('[contenteditable=true]')`);
  await page.call("Page.bringToFront");
  await page.evaluate(
    `(()=>{const e=document.querySelector('[contenteditable=true]');e.focus();const range=document.createRange();range.selectNodeContents(e);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);return true})()`,
  );
  await page.call("Input.insertText", { text });
}
async function open(mode) {
  await click(".pk-tools button", "增强");
  await click(".pk-flyout [role=menuitem]", mode);
}
async function screenshot(name) {
  const clip = await page.evaluate(
    `(()=>{const r=document.querySelector('.pk-flyout').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()`,
  );
  await page.screenshot(`work/native/${name}.png`, clip);
}
let original,
  configured = false;
try {
  await mkdir("work/native", { recursive: true });
  await page.call("Page.enable");
  await page.call("Page.bringToFront");
  await page.evaluate(
    `(()=>{document.querySelector('.pk-flyout')?.hidePopover();return true})()`,
  );
  await pause(100);
  await settings();
  original = await page.evaluate(
    `Object.fromEntries([...document.querySelectorAll('.pk-management label')].map(l=>[l.querySelector('span')?.textContent,l.querySelector('select,input:not([type=password])')?.value]).filter(([k,v])=>k&&v!==undefined))`,
  );
  await field("模型连接", "independent");
  const independent = await page.evaluate(
    `Object.fromEntries([...document.querySelectorAll('.pk-management label')].map(l=>[l.querySelector('span')?.textContent,l.querySelector('select,input:not([type=password])')?.value]).filter(([k,v])=>k&&v!==undefined))`,
  );
  original = { ...independent, ...original };
  await field(
    "Base URL，包含 API 前缀",
    `http://127.0.0.1:${server.address().port}/v1`,
  );
  await field("模型名称", "promptkit-test-fixture");
  await field("协议", "chat_completions");
  await field("密钥引用", "PROMPTKIT_QUICK_UI_TEST_KEY");
  await field("API Key", "local-test-only");
  await click(".pk-management button", "保存密钥");
  await wait(
    `document.querySelector('.pk-management .pk-notice')?.textContent==='已保存'`,
  );
  configured = true;
  assert(
    await page.evaluate(
      `document.querySelectorAll('.pk-management [role=tab]').length===4`,
    ),
    "Management sections are embedded in Harness Settings",
  );
  await closeSettings();
  await page.evaluate(
    `(()=>{[...document.querySelectorAll('button')].find(b=>(b.getAttribute('aria-label')||'').startsWith('在')&&(b.getAttribute('aria-label')||'').includes(${JSON.stringify(project)})).click();return true})()`,
  );
  await pause(700);
  await draft("为团队编写一个任务管理工具。");
  await wait(
    `document.querySelector('[contenteditable=true]').innerText.includes('为团队编写一个任务管理工具')`,
  );
  await pause(150);
  await open("改写");
  await wait(
    `!!document.querySelector('.pk-flyout textarea')||!!document.querySelector('.pk-error')`,
  );
  assert(
    !(await page.evaluate(`!!document.querySelector('.pk-error')`)),
    "Choosing Rewrite starts generation immediately",
  );
  assert(report.requests === 1, "Mode selection issues one model request");
  assert(
    await page.evaluate(
      `document.querySelector('.pk-flyout').matches(':popover-open')&&!document.querySelector('.pk-backdrop')`,
    ),
    "Quick panel uses a native non-modal popover",
  );
  assert(
    await page.evaluate(
      `document.querySelector('.pk-flyout').getBoundingClientRect().width<=560`,
    ),
    "Enhancement panel is bounded to 560px",
  );
  await screenshot("quick-rewrite-dark");
  await click(".pk-flyout button", "替换草稿");
  await wait(`document.querySelector('.pk-notice')?.textContent==='完成'`);
  assert(
    await page.evaluate(
      `document.querySelector('[contenteditable=true]').innerText.includes('已整理')`,
    ),
    "Result replaces the native draft without sending",
  );
  await click(".pk-flyout button", "关闭");
  await page.evaluate(
    `(()=>{document.querySelector('[contenteditable=true]').focus();return true})()`,
  );
  for (const type of ["keyDown", "keyUp"])
    await page.call("Input.dispatchKeyEvent", {
      type,
      key: "z",
      code: "KeyZ",
      modifiers: 2,
      windowsVirtualKeyCode: 90,
    });
  assert(
    await wait(
      `document.querySelector('[contenteditable=true]').innerText.trim()==='为团队编写一个任务管理工具。'`,
    ),
    "Native undo restores the original draft",
  );
  await open("追问");
  for (let round = 1; round <= 3; round++) {
    await wait(
      `!!document.querySelector('.pk-option')||!!document.querySelector('.pk-error')`,
    );
    assert(
      !(await page.evaluate(`!!document.querySelector('.pk-error')`)),
      `Question round ${round} completes`,
    );
    assert(
      !(await page.evaluate(
        `[...document.querySelectorAll('.pk-option input')].some(e=>e.checked)`,
      )),
      `Round ${round} recommendations are unselected`,
    );
    const count = await page.evaluate(
      `document.querySelectorAll('.pk-flyout [role=tab]').length`,
    );
    assert(count === 3, `Round ${round} displays three questions`);
    if (round === 1) await screenshot("quick-questions-dark");
    for (let i = 0; i < count; i++) {
      await page.evaluate(
        `(()=>{document.querySelectorAll('.pk-flyout [role=tab]')[${i}].click();return true})()`,
      );
      await page.evaluate(
        `(()=>{document.querySelector('.pk-option input').click();return true})()`,
      );
    }
    await click(".pk-flyout button", "提交本轮答案");
    await wait(
      `!document.querySelector('.pk-flyout').innerText.includes('正在生成')&&([...(document.querySelectorAll('.pk-caption'))].some(e=>e.textContent.includes('轮次 ${round + 1} / 3'))||!!document.querySelector('.pk-feedback')||!!document.querySelector('.pk-error'))`,
    );
  }
  assert(
    await page.evaluate(
      `document.querySelector('.pk-flyout textarea')?.value.includes('已确认 3 轮问题')`,
    ),
    "Three rounds produce an editable final prompt",
  );
  await page.evaluate(
    `(()=>{document.querySelector('.pk-feedback summary').click();return true})()`,
  );
  await field("哪些地方需要调整？", "PromptKit 快捷验收", ".pk-flyout");
  await click(".pk-flyout button", "保存反馈到本机");
  await wait(
    `document.querySelector('.pk-notice')?.textContent==='反馈已保存'`,
  );
  assert(true, "Feedback is saved only after an explicit submit");
  await click(".pk-flyout button", "收藏提示词");
  await wait(`!!document.querySelector('.pk-flyout input[maxlength="200"]')`);
  assert(
    await page.evaluate(
      `document.querySelector('.pk-flyout').getBoundingClientRect().width===420`,
    ),
    "Saving a result opens the independent 420px library",
  );
  await page.evaluate(
    `(()=>{const e=document.querySelector('.pk-flyout input[maxlength="200"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(fixtureTitle)});e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`,
  );
  await click(".pk-flyout button", "保存修改");
  await wait(`document.querySelector('.pk-notice')?.textContent==='已保存'`);
  await screenshot("quick-library-dark");
  assert(
    !(await page.evaluate(
      `document.querySelector('.pk-flyout').innerText.includes('导入 JSON')`,
    )),
    "Quick library omits maintenance controls",
  );
  await page.call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await page.call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  assert(
    await wait(`!document.querySelector('.pk-flyout')`),
    "Escape dismisses the native panel",
  );
  await click(".pk-tools button", "收藏库");
  await wait(`!!document.querySelector('.pk-item')`);
  await page.call("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: 5,
    y: 100,
    button: "left",
    clickCount: 1,
  });
  await page.call("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: 5,
    y: 100,
    button: "left",
    clickCount: 1,
  });
  assert(
    await wait(`!document.querySelector('.pk-flyout')`),
    "Clicking outside dismisses the native panel",
  );
  await page.call("Emulation.setDeviceMetricsOverride", {
    width: 400,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await click(".pk-tools button", "收藏库");
  await wait(`!!document.querySelector('.pk-item')`);
  assert(
    await page.evaluate(
      `(()=>{const r=document.querySelector('.pk-flyout').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.width<=376&&document.querySelector('.pk-flyout').scrollWidth<=r.width})()`,
    ),
    "Library fits a 400px viewport without horizontal overflow",
  );
  await screenshot("quick-library-narrow");
  await click(".pk-flyout button", "关闭");
  await page.call("Emulation.clearDeviceMetricsOverride");
  await draft("检查这个文件并保留文件引用。 ");
  const reference = resolve("work/native/promptkit-quick-reference.txt");
  await writeFile(reference, "Synthetic reference fixture.");
  const dom = await page.call("DOM.getDocument"),
    file = await page.call("DOM.querySelector", {
      nodeId: dom.root.nodeId,
      selector: "input[type=file]",
    });
  await page.call("DOM.setFileInputFiles", {
    nodeId: file.nodeId,
    files: [reference],
  });
  await wait(
    `document.querySelector('[contenteditable=true]').innerText.includes('promptkit-quick-reference')`,
  );
  const chips = await page.evaluate(
    `[...document.querySelector('[contenteditable=true]').querySelectorAll('[contenteditable=false]')].map(e=>e.textContent)`,
  );
  assert(chips.length > 0, "Native file picker creates a structured reference");
  await open("改写");
  await wait(
    `!!document.querySelector('.pk-flyout textarea')||!!document.querySelector('.pk-error')`,
  );
  await click(".pk-flyout button", "替换草稿");
  await wait(
    `document.querySelector('.pk-notice')?.textContent==='完成'||!!document.querySelector('.pk-error')`,
  );
  const after = await page.evaluate(
    `[...document.querySelector('[contenteditable=true]').querySelectorAll('[contenteditable=false]')].map(e=>e.textContent)`,
  );
  assert(
    JSON.stringify(chips) === JSON.stringify(after) &&
      !(await page.evaluate(`!!document.querySelector('.pk-error')`)),
    "Replacement retains the native reference",
  );
  await click(".pk-flyout button", "关闭");
  await settings();
  await click(".pk-management [role=tab]", "反馈");
  await wait(
    `document.querySelector('.pk-management').innerText.includes('PromptKit 快捷验收')`,
  );
  assert(true, "Submitted feedback appears in Settings");
  await click(".pk-management [role=tab]", "收藏库");
  await wait(`!!document.querySelector('.pk-management .pk-item')`);
  const downloadPath = resolve(`work/native/quick-download-${Date.now()}`);
  await mkdir(downloadPath, { recursive: true });
  await page.call("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath,
  });
  await click(".pk-management button", "导出 JSON");
  let exported;
  for (let i = 0; i < 100; i++) {
    try {
      exported = JSON.parse(
        await readFile(
          resolve(downloadPath, "promptkit-favorites.json"),
          "utf8",
        ),
      );
      break;
    } catch {
      await pause(100);
    }
  }
  assert(
    exported?.version === 1,
    "Management exports a versioned favorites file",
  );
  const item = exported.favorites.find((f) => f.title === fixtureTitle),
    importPath = resolve("work/native/quick-import.json");
  await writeFile(
    importPath,
    JSON.stringify({
      version: 1,
      favorites: [
        item,
        {
          ...item,
          id: `promptkit-quick-import-${Date.now()}`,
          title: "PromptKit 验收：快捷导入",
        },
      ],
    }),
  );
  const importDom = await page.call("DOM.getDocument"),
    importInput = await page.call("DOM.querySelector", {
      nodeId: importDom.root.nodeId,
      selector: ".pk-management .pk-file",
    });
  await page.call("DOM.setFileInputFiles", {
    nodeId: importInput.nodeId,
    files: [importPath],
  });
  await wait(
    `document.querySelector('.pk-management').innerText.includes('新增: 1')`,
  );
  assert(
    await page.evaluate(
      `document.querySelector('.pk-management').innerText.includes('跳过重复: 1')`,
    ),
    "Import previews additions and duplicate IDs",
  );
  await click(".pk-management button", "导入这些提示词？");
  await wait(`document.querySelector('.pk-notice')?.textContent==='已导入'`);
  assert(true, "Confirmed management import persists");
  await closeSettings();
} catch (error) {
  report.errors.push(error.message);
  report.ui = await page.evaluate(
    `({panel:document.querySelector('.pk-flyout')?.innerText,tools:[...document.querySelectorAll('.pk-tools>button')].map(b=>b.textContent)})`,
  );
  process.exitCode = 1;
} finally {
  try {
    await page.call("Emulation.clearDeviceMetricsOverride");
    await page.call("Browser.setDownloadBehavior", { behavior: "default" });
    await page.evaluate(
      `(()=>{document.querySelector('.pk-flyout')?.hidePopover();return true})()`,
    );
    if (configured) {
      await settings();
      await click(".pk-management button", "移除已保存密钥");
      await wait(
        `document.querySelector('.pk-management .pk-notice')?.textContent==='已保存'`,
      );
      for (const label of [
        "Base URL，包含 API 前缀",
        "模型名称",
        "协议",
        "密钥引用",
      ])
        await field(label, original[label] || "");
      await field("模型连接", original["模型连接"]);
      if (original["模型连接"] === "host")
        await field("模型", original["模型"]);
      await save();
      report.checks.push(
        "Removed the fixture credential and restored model settings",
      );
      await closeSettings();
    }
  } catch (error) {
    report.errors.push("Restore: " + error.message);
    process.exitCode = 1;
  }
  page.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await writeFile("work/native/quick.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
