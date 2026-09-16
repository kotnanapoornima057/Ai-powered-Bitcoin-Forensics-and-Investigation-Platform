import jwt from 'jsonwebtoken';
import config from '../config.js';
export function requireAuth(req,res,next){const h=req.headers.authorization||'';const t=h.startsWith('Bearer ')?h.slice(7):null;if(!t)return res.status(401).json({error:'Authentication required.'});try{req.user=jwt.verify(t,config.jwtSecret);next();}catch{return res.status(401).json({error:'Invalid or expired token.'});}}
