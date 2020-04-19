const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

module.exports = {
    htmlToPdf: async (html) => {
        const buffer = Buffer.from(html);
        const base64 = buffer.toString('base64');
        const generatedBase64 = 'data:text/html;base64,' + base64;

        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});

        const page = await browser.newPage();

        await page.goto(generatedBase64, {waitUntil: 'networkidle0'});

        await page.setContent(html);

        const pdf = await page.pdf({format: 'A4', printBackground: true});

        await browser.close();

        return pdf;
    },
    APP_URL: 'https://naijabarrescue.netlify.app',
    smtpTransport: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    })
};