const puppeteer = require('puppeteer');

module.exports = {
    htmlToPdf: async (html) => {
        const buffer = Buffer.from(html);
        const base64 = buffer.toString('base64');
        const generatedBase64 = 'data:text/html;base64,' + base64;

        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();

        await page.goto(generatedBase64, {waitUntil: 'networkidle0'});

        await page.setContent(html);

        const pdf = await page.pdf({ format: 'A4', printBackground: true });

        await browser.close();

        return pdf;
    }
};