import supertest from 'supertest'
import { app } from '../app.js'

describe('User APIs tests with bad request', () => {
    test("it should return 400 because there is no refresh token", async ()=>{
        const response = await supertest(app).get('/user/confirm')
        expect(response.status).toBe(400)
    })
     
    test("it should return 400 because there is no code", async ()=>{
        const reponse = await supertest(app).get('/user/tokens')
        expect(reponse.status).toBe(400)
    })

    test("it should return 200 because just clears the cookies", async ()=>{
        const response = await supertest(app).get('/user/logout')
        expect(response.status).toBe(200)
    })

    test("it should return 400 becuase there is no refresh token", async ()=>{
        const response = await supertest(app).get('/user/refresh')
        expect(response.status).toBe(400)
    })
})