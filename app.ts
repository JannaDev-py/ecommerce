import express from 'express'
import cookieParser from 'cookie-parser'
import { UserRouter } from './Routes/user.js'
import { ProductRouter } from './Routes/product.js'

export const app = express()

app.use(express.json())
app.use(cookieParser())

app.all('/api/user', UserRouter)
app.all('/api/product', ProductRouter)

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})