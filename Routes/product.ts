import { Router, Request, Response } from 'express'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { validateToken, validateAdmin } from '../middlewares/accessToken'
import { validateProductData, validateProductDataPartial } from '../middlewares/productData'
import multer from 'multer'
import {
    PutObjectCommand,
    DeleteObjectCommand,
    S3Client,
    S3ServiceException,
    waitUntilObjectNotExists
} from "@aws-sdk/client-s3";

dotenv.config()

const upload = multer({ storage: multer.memoryStorage() }) 

export async function connectionDB (){
    try{
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST as string,
            user: 'admin',
            password: process.env.DB_PASSWORD as string,
            database: "ecommerce"
        })
        return connection
    }catch{
        throw new Error("Error connecting to the database")
    }
}

const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
})

async function uploadToS3(command: PutObjectCommand) {
    try{
        const response = await s3.send(command);
        return response;
    }catch (caught) {
        if (
            caught instanceof S3ServiceException &&
            caught.name === "EntityTooLarge" ) 
        {
            throw new Error("File size exceeds the limit. Please upload a smaller file.")
        } else if (caught instanceof S3ServiceException) {
            throw new Error(`Error uploading file`);
        } else {
            throw caught;
        }
    }
}

export const ProductRouter = Router()

ProductRouter.get('/', async (req: Request, res: Response) => {
    const connection = await connectionDB()
    try{
        const data = await connection.query('SELECT id, image_url, name, description, price, stock FROM products')
        connection.end()
        res.json(data[0])
    }catch{
        connection.end()
        res.status(500).json({ "message": "error fetching products "})
    }
})

ProductRouter.post('/', validateToken, validateAdmin, upload.single('image'), validateProductData, async (req: Request, res: Response) => {
    const connection = await connectionDB()
    if(!req.file){
        res.status(400).json({ "message": "No image file provided" })
        connection.end()
        return
    }
    const fileKey = `products/${Date.now()}-${req.file.originalname}`
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    })
 
    try {
        await uploadToS3(command)
    }catch(e){
        res.status(500).json({ "message": "error uploading file to s3" })
        connection.end()
        return
    }

    try{
        connection.beginTransaction()
        const { name, description, price, stock } = req.body
        await connection.query('INSERT INTO products ( image_url, name, description, price, stock) VALUES (?, ?, ?, ?, ?)', 
            [ fileKey, name, description, price, stock] )
        connection.commit()
        connection.end()
        res.sendStatus(201)
    }catch(e){
        connection.rollback()
        connection.end()
        res.json({ "message": "error creating product "})
    }
})

ProductRouter.patch('/:id', validateToken, validateAdmin, upload.single('image'), validateProductDataPartial, async (req: Request, res: Response) => {
    const connection = await connectionDB()
    const { id } = req.params
    if(!req.body){
        res.status(400).json({ "message": "No data provided for update" })
    }
    try{
        connection.beginTransaction()
        connection.query('UPDATE products SET ? WHERE id = ?', [req.body, id])
        connection.commit()
        connection.end()
        res.sendStatus(200)
    }catch{
        connection.rollback()
        connection.end()
        res.json({ "message": "error updating product "})
    }
})

ProductRouter.delete('/:id', validateToken, validateAdmin, async (req: Request, res: Response) => {
    const connection = await connectionDB()
    const { id } = req.params
    if(!id){
        res.status(400).json({ "message": "No product ID provided" })
        return
    }

    const fileKey = req.body.fileKey

    try{
        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME as string,
                Key: fileKey,
            })
        )
        await waitUntilObjectNotExists(
        { client: s3, maxWaitTime: 60 },
        { 
            Bucket: process.env.AWS_BUCKET_NAME as string, 
            Key: fileKey 
        })
    }catch{
        res.status(500).json({ "message": "error deleting file from s3" })
        return
    }

    try{
        connection.beginTransaction()
        await connection.query('DELETE FROM products WHERE id = ?', [id])
        connection.commit()
        connection.end()
        res.sendStatus(200)
    }catch{
        connection.rollback()
        connection.end()
        res.json({ "message": "error deleting product "})
    }
})