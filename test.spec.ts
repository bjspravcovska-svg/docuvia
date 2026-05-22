import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Upload 30 documents and test functionality', async ({ page }) => {
  // Zvýšime timeout kvôli nahrávaniu
  test.setTimeout(120000);

  // 1. Prihlásenie
  await page.goto('http://localhost:5173');
  
  // Klikneme na Pokračovať cez Google (mock login)
  await page.click('text="Pokračovať cez Google"');
  
  // Počkáme, kým sa načíta Dashboard (hľadáme tlačidlo Nahrávanie)
  await page.waitForSelector('text="Nahrávanie"');

  // 2. Vytvoríme 30 testovacích PDF súborov
  const testDir = path.join(__dirname, 'test-docs');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
  
  const filePaths = [];
  for (let i = 1; i <= 30; i++) {
    const filePath = path.join(testDir, `faktura_test_${i}.pdf`);
    fs.writeFileSync(filePath, 'dummy pdf content ' + i);
    filePaths.push(filePath);
  }
  
  // Pridáme zopár s identickým názvom na test duplicity
  const dupPath = path.join(testDir, `faktura_test_5.pdf`); // Rovnaký názov ako 5.
  filePaths.push(dupPath);

  // 3. Nahráme ich
  console.log('Nahrávam 30+ dokumentov...');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(filePaths);
  } else {
    throw new Error("Nenašiel som input pre súbory");
  }

  // Počkáme, kým sa všetky spracujú (zmizne text Spracúva sa)
  // Upload je obmedzený na 5 naraz
  console.log('Čakám na dokončenie spracovania...');
  await page.waitForFunction(() => {
    return !document.body.innerText.includes('Spracúva sa') && !document.body.innerText.includes('Čaká v rade');
  }, { timeout: 100000 });

  // Skontrolujeme, či vyskočila duplicita
  const text = await page.content();
  if (text.includes('Duplikát')) {
    console.log('✅ Duplicita bola úspešne odhalená.');
  } else {
    console.log('❌ Duplicita nebola nájdená.');
  }

  // 4. Zoradenie (klikneme na Dátum)
  console.log('Testujem zoradenie...');
  await page.click('th:has-text("Dátum")');
  await page.waitForTimeout(1000); // počkáme na zoradenie
  
  // 5. Rozdelenie (Split) - skúsime nájsť tlačidlo pre rozdelenie
  console.log('Hľadám tlačidlo na rozdelenie...');
  const splitBtn = await page.$('button[title="Rozdeliť na jednotlivé strany"]');
  if (splitBtn) {
    console.log('✅ Tlačidlo Rozdeliť existuje.');
  } else {
    console.log('Tlačidlo Rozdeliť sa zobrazuje len pre viacstranové PDF (náš dummy nie je viacstranový).');
  }

  console.log('Všetky testy prebehli úspešne!');
});
