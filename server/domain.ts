import {z} from 'zod';
export const statuses=['Сбор документов','КП выдано','СП выдано','Победа','Проигрыш'] as const;
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Некорректная дата');
export const schema=z.object({received:date,requestNumber:z.string().trim().max(150).default(''),number:z.string().trim().max(150),tender:z.string().trim().max(150),customer:z.string().trim().min(1).max(500),managerId:z.string().uuid(),status:z.enum(statuses),offerDate:date.nullable(),amount:z.string().regex(/^\d{1,13}(\.\d{1,2})?$/).nullable(),comment:z.string().max(5000),review:z.boolean().default(false)});
export type State=z.infer<typeof schema>;
export const open=(s:string)=>statuses.slice(0,3).includes(s as any);
export const money=(s:string|null)=>s===null?0n:BigInt(s.split('.')[0])*100n+BigInt((s.split('.')[1]||'').padEnd(2,'0'));
export const decimal=(v:bigint)=>`${v/100n}.${(v%100n).toString().padStart(2,'0')}`;
export function week(input:string,policy=process.env.WEEKEND_POLICY||'previous'){
 const d=new Date(input+'T00:00:00+03:00');if(isNaN(+d))throw Error('Неверная неделя');
 const day=new Date(+d+10800000).getUTCDay();d.setUTCDate(d.getUTCDate()-((day+6)%7));
 const monday=+d, start=monday-(policy==='next'?2*86400000:0),end=start+7*86400000;
 const iso=(n:number)=>new Date(n+10800000).toISOString().slice(0,10);
 return {monday:iso(monday),friday:iso(monday+4*86400000),start:new Date(start).toISOString(),end:new Date(end).toISOString(),startDate:iso(start),endDate:iso(end),policy};
}
export type Revision={id?:string;request_id:string;recorded_at:string;state:State;previous:State|null;kind:string};
export const labels:Record<string,string>={new:'Поступило новых заявок',newDocs:'Новые: сбор документов на конец недели',newOffers:'Новые: КП / СП на конец недели',newWin:'Новые: победа на конец недели',newLoss:'Новые: проигрыш на конец недели',oldOpen:'Открыто на начало недели',oldDocs:'На начало: сбор документов',oldOffers:'На начало: КП / СП',oldMoved:'Перешли из сбора в КП / СП и остались там',oldWin:'Победы старых заявок за неделю',oldLoss:'Проигрыши старых заявок за неделю',kpSp:'Переходы КП → СП за неделю',winsNew:'Победы новых заявок за неделю',wins:'Всего побед за неделю',lossNew:'Проигрыши новых заявок за неделю',losses:'Всего проигрышей за неделю',endDocs:'Осталось на сборе документов',endOffers:'Ожидают результата: КП / СП',endOpen:'Всего открытых на конец недели'};
export function report(revs:Revision[],input:string,manager?:string){
 const w=week(input), groups=new Map<string,Revision[]>();
 for(const r of revs){const g=groups.get(r.request_id)||[];g.push(r);groups.set(r.request_id,g);}
 const metrics:Record<string,{label:string;count:number;amount:string;unknown:number;items:any[];basis:string}>={};
 for(const [k,label] of Object.entries(labels))metrics[k]={label,count:0,amount:'0.00',unknown:0,items:[],basis:['oldOpen','oldDocs','oldOffers'].includes(k)?'Состояние и сумма на начало периода': ['oldWin','oldLoss','kpSp','winsNew','wins','lossNew','losses'].includes(k)?'Фактическое событие и сумма в момент события; одна заявка один раз, последнее событие этого вида':'Состояние и сумма на конец периода'};
 const add=(key:string,id:string,s:State,at?:string)=>{if(manager&&s.managerId!==manager)return;const m=metrics[key];m.items.push({id,...s,eventAt:at});m.count++;if(s.amount===null)m.unknown++;else m.amount=decimal(money(m.amount)+money(s.amount));};
 for(const [id,rs] of groups){rs.sort((a,b)=>Date.parse(a.recorded_at)-Date.parse(b.recorded_at)||Number(a.id||0)-Number(b.id||0));
 const before=(t:string)=>rs.filter(r=>r.recorded_at<t).at(-1)?.state;
 const a=before(w.start),b=before(w.end);if(!b)continue;
 const fresh=b.received>=w.startDate&&b.received<w.endDate,old=b.received<w.startDate;
 if(fresh){add('new',id,b);add(b.status==='Сбор документов'?'newDocs':['КП выдано','СП выдано'].includes(b.status)?'newOffers':b.status==='Победа'?'newWin':'newLoss',id,b);}
 if(a&&a.received<w.startDate&&open(a.status)){add('oldOpen',id,a);add(a.status==='Сбор документов'?'oldDocs':'oldOffers',id,a);if(old&&a.status==='Сбор документов'&&['КП выдано','СП выдано'].includes(b.status))add('oldMoved',id,b);}
 if(b.received<w.endDate&&open(b.status)){add('endOpen',id,b);add(b.status==='Сбор документов'?'endDocs':'endOffers',id,b);}
 const events=rs.filter(r=>r.recorded_at>=w.start&&r.recorded_at<w.end&&r.kind!=='import'&&r.state.status!==r.previous?.status);
 for(const [status,key,total,newKey] of [['Победа','oldWin','wins','winsNew'],['Проигрыш','oldLoss','losses','lossNew']]){const e=events.filter(r=>r.state.status===status).at(-1);if(e){const isNew=e.state.received>=w.startDate&&e.state.received<w.endDate;add(isNew?newKey:key,id,e.state,e.recorded_at);add(total,id,e.state,e.recorded_at);}}
 const e=events.filter(r=>r.previous?.status==='КП выдано'&&r.state.status==='СП выдано'&&r.state.received<w.startDate).at(-1);if(e)add('kpSp',id,e.state,e.recorded_at);
 }
 return {week:w,metrics,limitations:'Импорт — известное состояние на дату загрузки, а не подтверждённое событие прошлого. До первой известной версии состояние не восстанавливается. Исправления действуют с момента записи и сохраняются в истории.'};
}
