import { Router, Request, Response } from 'express'
import dotenv from 'dotenv'
import axios from 'axios'
import { cognitoDomain, urlRedirectCognito } from '../config/config'

export const UserRouter = Router()
dotenv.config()

UserRouter.get('/confirm', (req: Request, res: Response)=>{
    if(!req.cookies.refreshToken){
        res.status(400).json({"message": "you need to login"})
    }
    res.sendStatus(200) 
})

UserRouter.put('/tokens', (req: Request, res: Response) => {
    if(!req.body || !req.body.code){
        res.status(400).json({"message": "missing code"})
        return
    }

    const { code } = req.body

    const data = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.CLIENT_ID_COGNITO as string,
        client_secret: process.env.SECRET_CLIENT_COGNITO as string,
        code,
        redirect_uri: urlRedirectCognito
    }) 

    axios.post(cognitoDomain + '/oauth2/token', data, {
        headers:{
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response =>{
        const access_token = response.data.access_token
        const refresh_token = response.data.refresh_token

        res.cookie('refreshToken', refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        res.cookie('accessToken', access_token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })

        res.sendStatus(200)
    })
    .catch(e => {
        console.log(e)
        res.status(400).json({"message": "invalid code"})
    })
})

UserRouter.get('/logout', (req: Request, res: Response) => {
    res.clearCookie('refreshToken')
    res.clearCookie('accessToken')
    res.sendStatus(200)
})

UserRouter.get('/refresh', (req: Request, res: Response) => {
    const refresh_token = req.cookies.refreshToken

    if(!refresh_token){
        res.status(400).json({"message": "missing credentials"})
        return
    }

    const data = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.CLIENT_ID_COGNITO as string,
        client_secret: process.env.SECRET_CLIENT_COGNITO as string,
        refresh_token,
    })

    axios.post(cognitoDomain + '/oauth2/token', data.toString(), {
        headers:{
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
        const access_token = response.data.access_token
        res.cookie('accessToken', access_token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        })
        res.sendStatus(200)
    })
    .catch(e => {
        res.status(400).json({"message": "invalid code you need to login again"})
    })
})
