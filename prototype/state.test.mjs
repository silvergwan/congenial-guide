import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition,GRACE} from './state.mjs';
const guest=s=>s.guests[0];
test('appointment and grace boundaries, repeated ticks do not duplicate request',()=>{
 let s=initialState();s=transition(s,{type:'schedule',id:'g1',at:s.now+60_000});
 s=transition(s,{type:'advance',minutes:1});assert.equal(guest(s).status,'awaiting');
 s=transition(s,{type:'advance',minutes:14});assert.equal(guest(s).status,'awaiting');
 s=transition(s,{type:'advance',minutes:1});assert.equal(guest(s).status,'needs_check');
 s=transition(s,{type:'advance',minutes:30});assert.equal(guest(s).history.length,2);
});
test('reschedule replaces previous deadline; cancellation prevents later requests',()=>{
 let s=initialState();s=transition(s,{type:'schedule',id:'g1',at:s.now+60_000});
 s=transition(s,{type:'schedule',id:'g1',at:s.now+60*60_000});
 s=transition(s,{type:'advance',minutes:20});assert.equal(guest(s).status,'scheduled');
 s=transition(s,{type:'cancel',id:'g1'});s=transition(s,{type:'advance',minutes:120});
 assert.equal(guest(s).status,'cancelled');assert.ok(!guest(s).history.some(x=>x.text.includes('요청 표시')));
});
test('failed contact stays checking and late response retains contact log',()=>{
 let s=initialState();s=transition(s,{type:'start',id:'g2'});s=transition(s,{type:'contact',id:'g2'});
 assert.equal(s.guests[1].status,'checking');
 assert.throws(()=>transition(s,{type:'resolve',id:'g2',note:' '}));
 s=transition(s,{type:'respond',id:'g2'});assert.equal(s.guests[1].status,'responded');
 assert.ok(s.guests[1].history.some(x=>x.text.includes('연결되지')));
 const count=s.guests[1].history.length;s=transition(s,{type:'respond',id:'g2'});assert.equal(s.guests[1].history.length,count);
});
test('normal response prevents escalation and a new request archives previous history',()=>{
 let s=initialState();s=transition(s,{type:'schedule',id:'g1',at:s.now+60_000});
 s=transition(s,{type:'advance',minutes:1});s=transition(s,{type:'respond',id:'g1'});
 s=transition(s,{type:'advance',minutes:60});assert.equal(guest(s).status,'responded');
 const id=guest(s).requestId;s=transition(s,{type:'schedule',id:'g1',at:s.now+GRACE});
 assert.notEqual(guest(s).requestId,id);assert.equal(guest(s).archive[0].status,'responded');
});
test('host can close only with evidence and past appointment is rejected',()=>{
 let s=initialState();assert.throws(()=>transition(s,{type:'schedule',id:'g1',at:s.now}));
 s=transition(s,{type:'start',id:'g2'});s=transition(s,{type:'resolve',id:'g2',note:'가상 통화로 본인 응답 확인'});
 assert.equal(s.guests[1].status,'resolved');
});

test('appointment respects host hours including the 15 minute grace period',()=>{
 let s=initialState();
 assert.throws(()=>transition(s,{type:'schedule',id:'g1',at:Date.parse('2026-11-03T23:00:00+09:00')}));
 assert.throws(()=>transition(s,{type:'schedule',id:'g1',at:Date.parse('2026-11-04T17:59:00+09:00')}));
 s=transition(s,{type:'schedule',id:'g1',at:Date.parse('2026-11-03T22:45:00+09:00')});
 assert.equal(guest(s).status,'scheduled');
});