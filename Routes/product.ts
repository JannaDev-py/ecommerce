import { Router, Request, Response } from 'express'
import mysql from 'mysql2'
import dotenv from 'dotenv'
import { validateToken, validateAdmin } from '../middlewares/accessToken'
import { validateProductData, validateProductDataPartial } from '../middlewares/productData'
import multer from 'multer'
import {
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

dotenv.config()

const upload = multer({ storage: multer.memoryStorage() }) 

function connectionDB (){
    try{
        const connection = mysql.createConnection({
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

const connection = connectionDB()

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
    try{
        const data = await connection.query('SELECT id, image_url, name, description, price, stock FROM products')
        res.json(data)
    }catch{
        res.json({ "message": "error fetching products "})
    }
})

ProductRouter.post('/', validateToken, validateAdmin, validateProductData, upload.single('image'), async (req: Request, res: Response) => {
    if(!req.file){
        res.status(400).json({ "message": "No image file provided" })
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
        return
    }

    try{
        connection.beginTransaction(()=>{})
        const { name, description, price, stock } = req.body
        await connection.query('INSERT INTO products ( image_url, name, description, price, stock) VALUES (?, ?, ?, ?, ?)', 
            [ fileKey, name, description, price, stock] )
        connection.commit()
        res.sendStatus(200)
    }catch{
        connection.rollback(()=>{})
        res.json({ "message": "error creating product "})
    }
})

ProductRouter.patch('/:id', validateToken, validateAdmin, validateProductDataPartial, async (req: Request, res: Response) => {
    const { id } = req.params

    if(!req.body){
        res.status(400).json({ "message": "No data provided for update" })
    }

    try{
        connection.beginTransaction(()=>{})
        connection.query('UPDATE products SET ? WHERE id = ?', [req.body, id])
        connection.commit()
        res.sendStatus(200)
    }catch{
        connection.rollback(()=>{})
        res.json({ "message": "error updating product "})
    }
})

ProductRouter.delete('/:id', validateToken, validateAdmin, async (req: Request, res: Response) => {
    const { id } = req.params

    try{
        connection.beginTransaction(()=>{})
        await connection.query('DELETE FROM products WHERE id = ?', [id])
        connection.commit()
        res.sendStatus(200)
    }catch{
        connection.rollback(()=>{})
        res.json({ "message": "error deleting product "})
    }
})