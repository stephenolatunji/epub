const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');

const responseCodes = {
    SERVER_ERROR: 'SERVER_ERROR',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_NOT_CONFIRMED: 'USER_NOT_CONFIRMED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    BAR_ALREADY_EXISTS: 'BAR_ALREADY_EXISTS',
    INVALID_FIELDS: 'INVALID_FIELDS',
    INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
    BAR_NOT_FOUND: 'BAR_NOT_FOUND',
    TOTAL_FULL: 'TOTAL_FULL',
    ORDER_REACHED_LIMIT: 'ORDER_REACHED_LIMIT',
    VOUCHER_REACHED_LIMIT: 'VOUCHER_REACHED_LIMIT',
    VOUCHER_NOT_FOUND: 'VOUCHER_NOT_FOUND',
    VOUCHER_USED: 'VOUCHER_USED'
};

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
    }),
    responseCodes
};