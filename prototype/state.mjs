export const GRACE = 15 * 60_000;
export const baseTime = Date.parse('2026-11-03T20:10:00+09:00');
export const labels = {unregistered:'미신청',scheduled:'신청됨',awaiting:'응답 대기',needs_check:'확인 필요',checking:'확인 중',responded:'응답 완료',resolved:'확인 완료',cancelled:'취소됨'};
export const terminal = s => ['responded','resolved','cancelled'].includes(s);
export function initialState(){
 return {now:baseTime,seq:2,guests:[
 {id:'g1',name:'김하늘',room:'동백 101',status:'unregistered',at:null,history:[],archive:[]},
 {id:'g2',name:'이서준',room:'동백 102',status:'needs_check',at:baseTime-20*60_000,requestId:1,history:[{at:baseTime-20*60_000,text:'안부 확인 요청 표시 (데모)'}],archive:[]},
 {id:'g3',name:'박지우',room:'동백 103',status:'responded',at:baseTime-40*60_000,requestId:2,history:[{at:baseTime-38*60_000,text:'여행객이 괜찮아요로 응답했어요'}],archive:[]}
 ]};
}
function record(s,g,text){g.history.push({at:s.now,text});}
export function transition(state,action){
 const s=structuredClone(state); const g=s.guests.find(x=>x.id===action.id);
 if(action.type==='advance'){
   if(!Number.isFinite(action.minutes)||action.minutes<=0) throw Error('앞으로 이동할 시간을 선택해 주세요.');
   s.now+=action.minutes*60_000;
   for(const x of s.guests){
     if(x.status==='scheduled' && s.now>=x.at){x.status='awaiting';x.history.push({at:x.at,text:'안부 확인 요청 표시 (데모)'});}
     if(x.status==='awaiting' && s.now>=x.at+GRACE)x.status='needs_check';
   }
   return s;
 }
 if(!g) throw Error('여행객을 찾지 못했어요.');
 switch(action.type){
 case 'schedule':
   if(!Number.isFinite(action.at)||action.at<=s.now) throw Error('현재 데모 시각 이후로 선택해 주세요.');
   const local = new Date(action.at+9*3600_000); const minute = local.getUTCHours()*60+local.getUTCMinutes();
   if(minute<18*60||minute>22*60+45) throw Error('담당자 확인 시간을 위해 18:00–22:45 사이로 선택해 주세요.');
   if(!['unregistered','scheduled','awaiting'].includes(g.status)&&!terminal(g.status)) throw Error('담당자가 확인할 차례예요. 응답하거나 신청을 취소할 수 있어요.');
   if(g.status==='unregistered'||terminal(g.status)){
     if(g.requestId)g.archive.push({requestId:g.requestId,at:g.at,status:g.status,history:g.history});
     g.history=[];g.requestId=++s.seq;
   }
   g.at=action.at;g.status='scheduled';record(s,g,'안부 확인 시간을 약속했어요');break;
 case 'respond':
   if(!['awaiting','needs_check','checking'].includes(g.status))return s;
   g.status='responded';record(s,g,'여행객이 괜찮아요로 응답했어요');break;
 case 'cancel':
   if(g.status==='unregistered'||terminal(g.status))return s;
   g.status='cancelled';record(s,g,'여행객이 신청을 취소했어요');break;
 case 'start':
   if(g.status!=='needs_check')return s;
   g.status='checking';record(s,g,'윤호스트가 확인을 시작했어요');break;
 case 'contact':
   if(g.status!=='checking')return s;
   record(s,g,'연락을 시도했지만 연결되지 않았어요 (가상)');break;
 case 'resolve':
   if(g.status!=='checking')return s;
   if(!action.note?.trim())throw Error('연락 결과와 확인 근거를 적어 주세요.');
   g.status='resolved';record(s,g,'담당자 확인 완료: '+action.note.trim());break;
 default:throw Error('알 수 없는 동작이에요.');
 }
 return s;
}
