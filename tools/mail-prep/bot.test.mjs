import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMessages,toEML} from './bot.mjs';

const campaign = {id:'TEST',limit:1,sender:{name:'테스트',email:'sender@example.com'},period:'2026년 9~10월',baseline:'2025년 9~10월'};
const prospect = {id:'J001',name:'테스트 숙소',email:'host@example.com',operatorKey:'op-1',status:'ready',sourceUrl:'https://example.com/contact',evidence:'공개 문의 주소'};
test('중복 주소와 동일 운영자에게 중복 발송 준비하지 않는다',()=>{
  const c={...campaign,limit:2};
  assert.throws(()=>makeMessages(c,[prospect,{...prospect,id:'J002',operatorKey:'op-2'}],'안녕'));
  assert.throws(()=>makeMessages(c,[prospect,{...prospect,id:'J002',email:'another@example.com'}],'안녕'));
});
test('이메일 헤더 삽입과 미완성 템플릿을 차단한다',()=>{
  assert.throws(()=>makeMessages(campaign,[{...prospect,email:'host@example.com\r\nBcc: attacker@example.com'}],'안녕'));
  assert.throws(()=>makeMessages(campaign,[prospect],'{{missing}}'));
});
test('출처 미확인 후보와 20곳을 넘는 배치를 차단한다',()=>{
  assert.throws(()=>makeMessages(campaign,[{...prospect,status:'hold'}],'안녕'));
  assert.throws(()=>makeMessages({...campaign,limit:21},Array(21).fill(prospect),'안녕'));
});
test('한글 본문과 개인별 조사번호를 보존하는 메일 파일을 만든다',()=>{
  const [m]=makeMessages(campaign,[prospect],'{{name}}님\n{{period}} / {{baseline}}\n{{reference}}');
  assert.equal(m.body,'테스트 숙소님\n2026년 9~10월 / 2025년 9~10월\nTEST-J001');
  const eml=toEML(m);
  assert.equal(Buffer.from(eml.split('\r\n\r\n')[1].replace(/\s/g,''),'base64').toString('utf8'),m.body.replace(/\n/g,'\r\n'));
  assert.match(eml,/To: host@example.com\r\n/);
  assert.equal(m.status,'not_sent');
});
