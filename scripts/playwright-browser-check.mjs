import { chromium } from "playwright";

const executablePath = process.env.GSTACK_CHROME_EXECUTABLE_PATH;
if (!executablePath) {
  console.error("GSTACK_CHROME_EXECUTABLE_PATH is not set");
  process.exit(1);
}

const browser = await chromium.launch({ executablePath, headless: true });
await browser.close();
