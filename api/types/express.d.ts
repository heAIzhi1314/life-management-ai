import { Request, Response, Application } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        iat?: number
        exp?: number
      }
    }
    
    interface Application {
      use: any
    }
    
    interface Response {
      status: (code: number) => Response
      json: (obj: any) => Response
    }
  }
}

export {}