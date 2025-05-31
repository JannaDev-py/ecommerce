import express from 'express'
import cookieParser from 'cookie-parser'
import { UserRouter } from './Routes/user'
import { ProductRouter } from './Routes/product'

export const app = express()

app.use(express.json())
app.use(cookieParser())

app.use('/api/user', UserRouter)
// app.use('/api/product', ProductRouter)

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})