import supertest, { agent } from 'supertest'
import { app, server } from '../app'
import dotenv from 'dotenv'
import { cognitoLoginUrl } from '../config/config'
import puppeteer from "puppeteer"

dotenv.config()

afterAll(async () => {
    await server.close()
})


async function getAuthCodeCognito() {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto(cognitoLoginUrl)
    await page.type('.awsui_input_2rhyz_1y5qv_145[name="username"]', process.env.COGNITO_USERNAME as string)
    await page.click(".awsui_button_vjswe_1jo4q_153.awsui_variant-primary_vjswe_1jo4q_296.awsui_full-width_vjswe_1jo4q_1140")  
    await page.waitForNavigation()
    await page.type('.awsui_input_2rhyz_1y5qv_145', process.env.COGNITO_PASSWORD as string) 
    await page.click(".awsui_button_vjswe_1jo4q_153.awsui_variant-primary_vjswe_1jo4q_296.awsui_full-width_vjswe_1jo4q_1140") 

    await page.waitForNavigation()
    const url = page.url()
    const authCode = new URL(url).searchParams.get("code")

    await browser.close();
    return authCode;
}

describe('Product API Tests', () => {
    test('should return all products', async ()=>{
        const response = await supertest(app).get('/api/product')
        expect(response.status).toBe(200)
    })

    const agentAdmin = supertest.agent(app)
    test('should return the response with cookies', async () => {
        const code = await getAuthCodeCognito()
    
        const response = await agentAdmin.put('/api/user/tokens').send({
            code,
        })

        expect(response.headers["set-cookie"]).toHaveLength(2);
        expect(response.headers["set-cookie"][0]).toContain("refreshToken");
        expect(response.headers["set-cookie"][1]).toContain("accessToken");
        expect(response.status).toBe(200)
    }, 10000)

    test('should create a product', async ()=>{
        const productResponse = await agentAdmin.post('/api/product/')
            .field('name', 'test')
            .field('description', 'test')
            .field('price', 10)
            .field('stock', 10)
            .attach('image', 'tests/test-image.jpg')
        expect(productResponse.status).toBe(201)
    })
})

describe('Product API Tests with bad request', () => {
    test('should return 400 when no token provided', async ()=>{
        const response = await supertest(app).post('/api/product/')
        expect(response.body.message).toBe('token missing')
        expect(response.status).toBe(400)
    })
})