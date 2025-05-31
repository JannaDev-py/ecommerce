import supertest from 'supertest'
import { app, server } from '../app'
import { connectionDB } from '../Routes/product'

let connection: any

beforeAll(async () => {
    connection = await connectionDB()
})

afterAll(() => {
    server.close()
    connection.end()
})

describe('User APIs tests with bad request', () => {
    test("it should return 400 because there is no refresh token", async ()=>{
        const response = await supertest(app).get('/api/user/confirm')
        expect(response.status).toBe(400)
    })
     
    test("it should return 400 because there is no code", async ()=>{
        const reponse = await supertest(app).put('/api/user/tokens')
        expect(reponse.status).toBe(400)
    })

    test("it should return 200 because just clears the cookies", async ()=>{
        const response = await supertest(app).get('/api/user/logout')
        expect(response.status).toBe(200)
    })

    test("it should return 400 becuase there is no refresh token", async ()=>{
        const response = await supertest(app).get('/api/user/refresh')
        expect(response.status).toBe(400)
    })
})