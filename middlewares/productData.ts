import zod from 'zod'
import { NextFunction, Request, Response } from 'express'
import { connection } from '../Routes/product'

const productDataSchema = zod.object({
    name: zod.string().min(1, 'Product name is required'),
    description: zod.string().min(1, 'Product description is required'),
    price: zod.number().positive('Price must be a positive number'),
    stock: zod.number().int().nonnegative('Stock must be a non-negative integer'),
})

export type ProductData = zod.infer<typeof productDataSchema>

export function validateProductData(req: Request, res: Response, next: NextFunction) {
    const result = productDataSchema.safeParse(req.body)
    if (!result.success) {
    connection.end()
        res.status(400).json({
            message: 'Invalid product data',
            errors: result.error.errors,
        })
    }
    req.body = result.data
    next()
}

export function validateProductDataPartial(req: Request, res: Response, next: NextFunction) {
    const partialSchema = productDataSchema.partial()
    const result = partialSchema.safeParse(req.body)
    if (!result.success) {
        connection.end()
        res.status(400).json({
            message: 'Invalid product data',
            errors: result.error.errors,
        })
    }
    req.body = result.data
    next()
}