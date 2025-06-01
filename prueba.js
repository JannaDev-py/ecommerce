import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
export const cognitoLoginUrl = 'https://us-east-2das0cbdxm.auth.us-east-2.amazoncognito.com/login?client_id=41bim4ps29njohmjvn2da26f09&redirect_uri=https://localhost:5000/&response_type=code&scope=email+openid+phone'

dotenv.config()

async function getAuthCodeCognito() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto(cognitoLoginUrl)
    console.log(page.url())
    await page.type('.awsui_input_2rhyz_1y5qv_145[name="username"]', process.env.COGNITO_USERNAME)
    await page.click(".awsui_button_vjswe_1jo4q_153.awsui_variant-primary_vjswe_1jo4q_296.awsui_full-width_vjswe_1jo4q_1140")  
    await page.waitForNavigation()
    console.log(page.url())
    await page.type('.awsui_input_2rhyz_1y5qv_145', process.env.COGNITO_PASSWORD) 
    await page.click(".awsui_button_vjswe_1jo4q_153.awsui_variant-primary_vjswe_1jo4q_296.awsui_full-width_vjswe_1jo4q_1140") 

    await page.waitForNavigation()
    const url = page.url()
    console.log(url)
    const authCode = new URL(url).searchParams.get("code")

    await browser.close();
    return authCode;
}
const code = await getAuthCodeCognito();
console.log(code)