# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test.spec.ts >> Upload 30 documents and test functionality
- Location: test.spec.ts:5:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('text="Pokračovať cez Google"')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'fs';
  3  | import path from 'path';
  4  | 
  5  | test('Upload 30 documents and test functionality', async ({ page }) => {
  6  |   // Zvýšime timeout kvôli nahrávaniu
  7  |   test.setTimeout(120000);
  8  | 
  9  |   // 1. Prihlásenie
  10 |   await page.goto('http://localhost:5173');
  11 |   
  12 |   // Klikneme na Pokračovať cez Google (mock login)
> 13 |   await page.click('text="Pokračovať cez Google"');
     |              ^ Error: page.click: Test timeout of 120000ms exceeded.
  14 |   
  15 |   // Počkáme, kým sa načíta Dashboard (hľadáme tlačidlo Nahrávanie)
  16 |   await page.waitForSelector('text="Nahrávanie"');
  17 | 
  18 |   // 2. Vytvoríme 30 testovacích PDF súborov
  19 |   const testDir = path.join(__dirname, 'test-docs');
  20 |   if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
  21 |   
  22 |   const filePaths = [];
  23 |   for (let i = 1; i <= 30; i++) {
  24 |     const filePath = path.join(testDir, `faktura_test_${i}.pdf`);
  25 |     fs.writeFileSync(filePath, 'dummy pdf content ' + i);
  26 |     filePaths.push(filePath);
  27 |   }
  28 |   
  29 |   // Pridáme zopár s identickým názvom na test duplicity
  30 |   const dupPath = path.join(testDir, `faktura_test_5.pdf`); // Rovnaký názov ako 5.
  31 |   filePaths.push(dupPath);
  32 | 
  33 |   // 3. Nahráme ich
  34 |   console.log('Nahrávam 30+ dokumentov...');
  35 |   const fileInput = await page.$('input[type="file"]');
  36 |   if (fileInput) {
  37 |     await fileInput.setInputFiles(filePaths);
  38 |   } else {
  39 |     throw new Error("Nenašiel som input pre súbory");
  40 |   }
  41 | 
  42 |   // Počkáme, kým sa všetky spracujú (zmizne text Spracúva sa)
  43 |   // Upload je obmedzený na 5 naraz
  44 |   console.log('Čakám na dokončenie spracovania...');
  45 |   await page.waitForFunction(() => {
  46 |     return !document.body.innerText.includes('Spracúva sa') && !document.body.innerText.includes('Čaká v rade');
  47 |   }, { timeout: 100000 });
  48 | 
  49 |   // Skontrolujeme, či vyskočila duplicita
  50 |   const text = await page.content();
  51 |   if (text.includes('Duplikát')) {
  52 |     console.log('✅ Duplicita bola úspešne odhalená.');
  53 |   } else {
  54 |     console.log('❌ Duplicita nebola nájdená.');
  55 |   }
  56 | 
  57 |   // 4. Zoradenie (klikneme na Dátum)
  58 |   console.log('Testujem zoradenie...');
  59 |   await page.click('th:has-text("Dátum")');
  60 |   await page.waitForTimeout(1000); // počkáme na zoradenie
  61 |   
  62 |   // 5. Rozdelenie (Split) - skúsime nájsť tlačidlo pre rozdelenie
  63 |   console.log('Hľadám tlačidlo na rozdelenie...');
  64 |   const splitBtn = await page.$('button[title="Rozdeliť na jednotlivé strany"]');
  65 |   if (splitBtn) {
  66 |     console.log('✅ Tlačidlo Rozdeliť existuje.');
  67 |   } else {
  68 |     console.log('Tlačidlo Rozdeliť sa zobrazuje len pre viacstranové PDF (náš dummy nie je viacstranový).');
  69 |   }
  70 | 
  71 |   console.log('Všetky testy prebehli úspešne!');
  72 | });
  73 | 
```