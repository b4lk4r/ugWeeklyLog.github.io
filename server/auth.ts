import {scryptSync,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
export const hash=(p:string)=>{const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(p,salt,64).toString('hex');};
export const verify=(p:string,h:string)=>{const [salt,key]=h.split(':');return timingSafeEqual(scryptSync(p,salt,64),Buffer.from(key,'hex'));};
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
