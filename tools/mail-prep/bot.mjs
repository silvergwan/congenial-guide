import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const runtime = path.join(root, 'runtime');
const readJSON = async p => JSON.parse(await readFile(p, 'utf8'));
const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

export function makeMessages(campaign, prospects, template) {
  if (!emailPattern.test(campaign.sender.email) || /[\r\n]/.test(campaign.sender.name)) throw Error('발신자 정보 오류');
  if (!Number.isInteger(campaign.limit) || campaign.limit < 1 || campaign.limit > 20) throw Error('1차 발송 한도는 20곳입니다.');
  if (prospects.length !== campaign.limit) throw Error('후보 수와 발송 한도가 다릅니다.');
  const emails = new Set(), operators = new Set(), ids = new Set();
  return prospects.map(p => {
    if (!/^J\d{3}$/.test(p.id) || ids.has(p.id)) throw Error('중복 또는 잘못된 후보 번호');
    if (!emailPattern.test(p.email) || emails.has(p.email.toLowerCase())) throw Error(`중복 또는 잘못된 이메일: ${p.id}`);
    if (!p.operatorKey || operators.has(p.operatorKey)) throw Error(`운영자 중복: ${p.id}`);
    if (p.status !== 'ready' || !p.sourceUrl?.startsWith('https://') || !p.evidence) throw Error(`출처 확인 필요: ${p.id}`);
    if (typeof p.name !== 'string' || /[\r\n]/.test(p.name)) throw Error('숙소명 오류');
    ids.add(p.id); emails.add(p.email.toLowerCase()); operators.add(p.operatorKey);
    const reference = `${campaign.id}-${p.id}`;
    const variables = {name:p.name, senderName:campaign.sender.name, senderEmail:campaign.sender.email, reference, period:campaign.period, baseline:campaign.baseline};
    const body = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in variables)) throw Error(`알 수 없는 템플릿 변수: ${key}`);
      return variables[key];
    });
    if (/\{\{/.test(body)) throw Error('치환되지 않은 변수가 있습니다.');
    const subject = `제주 독채 숙소의 최근 예약 변화에 관해 여쭙습니다 [${reference}]`;
    const digest = createHash('sha256').update(JSON.stringify({from:campaign.sender,to:p.email,subject,body})).digest('hex');
    return {id:p.id,name:p.name,from:campaign.sender.email,senderName:campaign.sender.name,to:p.email,subject,body,reference,digest,sourceUrl:p.sourceUrl,status:'not_sent'};
  });
}

export function toEML(m) {
  const encoded = s => `=?UTF-8?B?${Buffer.from(s).toString('base64')}?=`;
  const subject = [...m.subject].reduce((chunks, char) => {
    if (!chunks.length || Buffer.byteLength(chunks.at(-1) + char) > 36) chunks.push(char);
    else chunks[chunks.length - 1] += char;
    return chunks;
  }, []).map(encoded).join('\r\n ');
  const body = Buffer.from(m.body.replace(/\r?\n/g,'\r\n')).toString('base64').match(/.{1,76}/g).join('\r\n');
  return [`From: ${encoded(m.senderName)} <${m.from}>`,`To: ${m.to}`,`Subject: ${subject}`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',body,''].join('\r\n');
}

async function prepare() {
  const [campaign, prospects, template] = await Promise.all([readJSON(path.join(root,'campaign.json')),readJSON(path.join(root,'prospects.json')),readFile(path.join(root,'../../templates/host-email-v0.1.txt'),'utf8')]);
  const messages = makeMessages(campaign,prospects,template);
  await mkdir(path.join(runtime,'outbox'), {recursive:true});
  let ledger;
  try { ledger = await readJSON(path.join(runtime,'ledger.json')); }
  catch(e) { if (e.code !== 'ENOENT') throw e; ledger = {campaignId:campaign.id,records:[]}; }
  if (ledger.campaignId !== campaign.id) throw Error('기존 기록과 조사번호가 다릅니다.');
  for (const m of messages) {
    const record = ledger.records.find(r=>r.id===m.id);
    if (record && record.digest !== m.digest) throw Error(`${m.id}: 기존 메일과 내용이 달라졌습니다. 기록 보존을 위해 중단합니다.`);
    if (!record) ledger.records.push({id:m.id,to:m.to,digest:m.digest,status:'not_sent',evidence:null});
    m.status = record?.status || 'not_sent';
    await writeFile(path.join(runtime,'outbox',`${m.id}.eml`),toEML(m),'utf8');
    await writeFile(path.join(runtime,'outbox',`${m.id}.txt`),`받는 사람: ${m.to}\n제목: ${m.subject}\n\n${m.body}`,'utf8');
  }
  await writeFile(path.join(runtime,'messages.json'),JSON.stringify(messages,null,2),'utf8');
  await writeFile(path.join(runtime,'ledger.json'),JSON.stringify(ledger,null,2),'utf8');
  const rows = prospects.map(p=>`| ${p.id} | ${p.name} | ${p.email} | ${p.region} | [출처](${p.sourceUrl}) | ${p.notes || '—'} |`).join('\n');
  await writeFile(path.join(root,'발송준비.md'),`# 제주 독채 숙소 조사 · 1차 20곳\n\n발신자: ${campaign.sender.name} <${campaign.sender.email}>\n\n비교 기간: ${campaign.period} / ${campaign.baseline}\n\n상태: 개별 메일 파일 20통 준비. 실제 발송 여부는 runtime/ledger.json을 확인합니다.\n\n공개 웹에 게시된 숙소별 주소이며 수신 가능 여부, 현재 영업 상태, Vacatio Solution PMS(구 파인호스트) 이용 여부는 확인되지 않았습니다. 공식 사이트·공식 채널 외에 숙소별 소개 페이지를 사용한 후보도 있습니다. 동일 이메일과 확인된 운영자 식별자는 중복 제거했습니다. 서로 다른 주소를 쓰는 동일 운영자까지 모두 식별했다는 뜻은 아닙니다.\n\n| 번호 | 숙소 | 이메일 | 지역 | 근거 | 참고 |\n|---|---|---|---|---|---|\n${rows}\n\n## 발송 본문 예시\n\n제목: ${messages[0].subject}\n\n${messages[0].body}\n`,'utf8');
  console.log(JSON.stringify({prepared:messages.length,sent:ledger.records.filter(r=>r.status==='sent').length,sender:campaign.sender.email,output:runtime},null,2));
}

async function status() {
  const ledger = await readJSON(path.join(runtime,'ledger.json'));
  console.log(JSON.stringify({campaignId:ledger.campaignId,counts:ledger.records.reduce((r,x)=>(r[x.status]=(r[x.status]||0)+1,r),{})},null,2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const command = process.argv[2] || 'status';
    if (command === 'prepare') await prepare();
    else if (command === 'status') await status();
    else throw Error('사용법: node bot.mjs prepare 또는 node bot.mjs status');
  } catch(e) {console.error(e.message); process.exitCode=1;}
}
