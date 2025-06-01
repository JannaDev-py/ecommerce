import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import { customRequest } from '../interfaces/interface'
dotenv.config()

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID_COGNITO as string,
    tokenUse: 'access',
    clientId: process.env.CLIENT_ID_COGNITO_ADMIN as string
})

export async function validateToken(req: Request, res: Response, next: NextFunction) {
    if(req.cookies && req.cookies.accessToken) {
        const token = req.cookies.accessToken
        try {
            const payload = await verifier.verify(token);
            (req as customRequest).user = payload.sub
            next()
        } catch (error) {
            res.status(401).json({"message": "invalid token"})
        }
    }else {
        res.status(400).json({"message": "token missing"})
    }
}

export async function validateAdmin(req: Request, res: Response, next: NextFunction) {
    if((req as customRequest).user === process.env.ADMIN_ID_COGNITO){
        next()
    }else {
        res.status(403).json({"message": "forbidden"})
    }
}
