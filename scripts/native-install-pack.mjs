import { connect } from "./cdp.mjs";
import { writeFile } from "node:fs/promises";
const page = await connect(),
  report = { checks: [], errors: [] };
async function wait(expression) {
  for (let i = 0; i < 300; i++) {
    const v = await page.evaluate(expression);
    if (v) return v;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw Error("Package install wait timed out");
}
async function click(expression) {
  await wait(`!!(${expression})`);
  await page.evaluate(`(()=>{(${expression}).click();return true})()`);
}
try {
  await click(
    `[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='选择添加插件方式')`,
  );
  await click(
    `[...document.querySelectorAll('[role=menu] button')].find(b=>b.textContent.includes('安装第三方插件'))`,
  );
  await wait(`!!document.querySelector('[role=dialog] input')`);
  await page.evaluate(
    `(()=>{const e=document.querySelector('[role=dialog] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'/workspace/dsh-promptkit/dist/dsh-promptkit-0.1.2.tgz');e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`,
  );
  await click(
    `[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.trim()==='安装'&&!b.disabled)`,
  );
  await wait(
    `document.querySelector('[role=dialog]')?.innerText.includes('已安装')||document.querySelector('[role=dialog]')?.innerText.includes('替换')||!!document.querySelector('[role=alert]')`,
  );
  report.result = await page.evaluate(
    `document.querySelector('[role=dialog]')?.innerText||document.querySelector('[role=alert]')?.innerText`,
  );
  if (report.result?.includes("已安装"))
    report.checks.push("Packed archive accepted by native plugin manager");
} catch (error) {
  report.errors.push(error.message);
  process.exitCode = 1;
} finally {
  await writeFile(
    "work/native/packed-install.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  page.close();
}
