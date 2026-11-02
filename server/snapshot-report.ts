import {report,open,money,decimal,Revision} from './domain';
export function snapshotReport(observations:any[],revs:Revision[],input:string,manager?:string){
 const result=report(revs,input,manager),w=result.week;
 const current=observations.filter(o=>o.week_start===w.monday&&(!manager||o.manager_id===manager));
 if(!current.length)return result;
 const priorDate=new Date(w.start);priorDate.setUTCDate(priorDate.getUTCDate()-7);const previousMonday=new Date(+priorDate+10800000).toISOString().slice(0,10);
 const previous=observations.filter(o=>o.week_start===previousMonday&&(!manager||o.manager_id===manager));
 const stateKeys=['new','newDocs','newOffers','newWin','newLoss','oldOpen','oldDocs','oldOffers','oldMoved','endDocs','endOffers','endOpen'];
 for(const key of stateKeys){const m=result.metrics[key];m.items=[];m.count=0;m.amount='0.00';m.unknown=0;m.basis='Сохранённое состояние и сумма на выбранном листе Excel; время события неизвестно';}
 for(const [key,label]of [['snapshotWin','Победа: состояние на листе Excel'],['snapshotLoss','Проигрыш: состояние на листе Excel'],['unknownDate','Неизвестна дата получения — проверить']])result.metrics[key]={label,count:0,amount:'0.00',unknown:0,items:[],basis:'Импортированное состояние; не подтверждает событие за неделю'};
 const add=(key:string,o:any)=>{const m=result.metrics[key],s=o.state;m.items.push({...s,id:o.request_id||null,observationId:o.id,sourceSheet:o.sheet,sourceRow:o.row_number});m.count++;if(s.amount===null)m.unknown++;else m.amount=decimal(money(m.amount)+money(s.amount));};
 // Use real edits made after import when viewing a period containing those edits.
 for(const o of current){if(!o.request_id)continue;const edits=revs.filter(r=>r.request_id===o.request_id&&r.kind!=='import'&&r.recorded_at<w.end).sort((a,b)=>a.recorded_at.localeCompare(b.recorded_at));if(edits.length)o.state=edits.at(-1)!.state;}
 const ids=new Set(observations.map(o=>o.request_id).filter(Boolean));
 for(const o of previous)if(o.state.received&&o.state.received<w.startDate&&open(o.state.status)){add('oldOpen',o);add(o.state.status==='Сбор документов'?'oldDocs':'oldOffers',o);}
 for(const o of current){const s=o.state;if(!s.received)add('unknownDate',o);else if(s.received>=w.startDate&&s.received<w.endDate){add('new',o);add(s.status==='Сбор документов'?'newDocs':['КП выдано','СП выдано'].includes(s.status)?'newOffers':s.status==='Победа'?'newWin':'newLoss',o);}
 if(open(s.status)){add('endOpen',o);add(s.status==='Сбор документов'?'endDocs':'endOffers',o);}else add(s.status==='Победа'?'snapshotWin':'snapshotLoss',o);
 if(o.request_id&&['КП выдано','СП выдано'].includes(s.status)&&previous.some(p=>p.request_id===o.request_id&&p.state.status==='Сбор документов'))add('oldMoved',o);
 }
 // Include genuinely new application records alongside the imported sheet.
 const live=report(revs.filter(r=>!ids.has(r.request_id)),input,manager);
 for(const key of stateKeys){const src=live.metrics[key],dst=result.metrics[key];dst.items.push(...src.items);dst.count+=src.count;dst.amount=decimal(money(dst.amount)+money(src.amount));dst.unknown+=src.unknown;}
 result.limitations='Показаны состояния выбранного листа Excel. Победа/проигрыш на листе — не доказательство события за эту неделю. Событийные показатели включают только реальные действия в приложении. Сумма берётся из сохранённого состояния. Неизвестные даты и неоднозначные совпадения отмечены для проверки. Будущие листы могут быть шаблонами.';
 return result;
}
