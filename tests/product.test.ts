import supertest from 'supertest'
import { app, server } from '../app'
import { connectionDB } from '../Routes/product'

let connection: any

beforeAll(async () => {
    connection = await connectionDB()
})

afterAll(async () => {
    await server.close()
    await connection.end()
})

describe('Product API Tests', () => {
    test('should return all products', async ()=>{
        const response = await supertest(app).get('/api/product')
        expect(response.status).toBe(200)
    })
})
describe('Product API Tests with bad request', () => {
    test('should return 400 when no token provided', async ()=>{
        const response = await supertest(app).post('/api/product')
        expect(response.body.message).toBe('token missing')
        expect(response.status).toBe(400)
    })
})