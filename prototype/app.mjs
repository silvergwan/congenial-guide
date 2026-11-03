
import {initialState,transition,labels,terminal} from './state.mjs';
let state=initialState(), view='host', selected='g1', filter='all', dialogGuest=null, returnFocus=null;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
 bubble:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H5l-3 2V11.5a9.5 9.5 0 0 1 19 0Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
 arrow:'<path d="m9 5 7 7-7 7"/>',check:'<path d="m5 12 4 4L19 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 home:'<path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-8h6v8"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 reset:'<path d="M3 11a9 9 0 1 1 3 8M3 4v7h7"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 leaf:'<path d="M20 3C8 1 2 8 6 15s14 4 14-12Z"/><path d="m4 21 11-13"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
};
const icon=(name,cls='')=>'<svg class="icon '+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
const fmt=t=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(t);
const day=t=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric'}).format(t);
const time=t=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(t);
const badge=s=>'<span class="badge '+s+'">'+(['responded','resolved'].includes(s)?icon('check'):'')+labels[s]+'</span>';
const button=(text,action,kind='primary',extra='')=>'<button class="button '+kind+'" data-action="'+action+'" '+extra+'>'+text+'</button>';
const needs=()=>state.guests.filter(g=>['needs_check','checking'].includes(g.status));
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
function act(action,message){
 try{state=transition(state,action);render();if(dialogGuest)showDetail(dialogGuest,false);if(message)toast(message);}
 catch(e){toast(e.message);}
}
function render(){
 $('#app').innerHTML=`
 <header class="app-header"><div class="header-inner">
 <a href="#host" class="brand" aria-label="안부 홈"><span class="brand-mark">${icon('bubble')}</span>안부<span class="brand-caption">여행을 잇는 작은 약속</span></a>
 <nav class="main-nav" aria-label="화면 선택">${[['guest','여행객'],['host','호스트'],['components','컴포넌트']].map(([key,label])=>'<button data-view="'+key+'" class="'+(view===key?'active':'')+'" '+(view===key?'aria-current="page"':'')+'>'+label+'</button>').join('')}</nav>
 <span class="prototype-tag"><span></span>개인 프로젝트 · DEMO</span>
 </div></header>
 <div class="demo-bar"><div class="demo-inner"><span class="demo-label">${icon('clock')}<b>데모 시계</b><time>${fmt(state.now)}</time><span class="timezone">KST</span></span><div class="clock-actions">${button('+15분','advance','small secondary','data-minutes="15"')}${button('+1시간','advance','small secondary','data-minutes="60"')}${button(icon('reset')+' 초기화','reset','small ghost')}</div></div></div>
 <main id="main" class="main ${view}">${view==='host'?hostView():view==='guest'?guestView():componentsView()}</main>
 <footer class="footer"><span>안부 · 제주 여행 안부 확인 프로토타입</span><span>가상 데이터로 작동하며 실제 알림·전화는 보내지 않아요.</span></footer>`;
}
function hostView(){
 const count=needs().length,done=state.guests.filter(g=>['responded','resolved'].includes(g.status)).length;
 const rows=state.guests.filter(g=>filter==='all'||(filter==='need'?['needs_check','checking'].includes(g.status):['responded','resolved'].includes(g.status)));
 return `<div class="page-heading"><div><p class="eyebrow">HOST WORKSPACE</p><h1>오늘의 안부를<br>한눈에 확인하세요</h1><p class="subtitle">작은 확인으로, 여행객의 하루에 마음을 더해요.</p></div><div class="property-label">${icon('home')}<div><strong>제주 동백 스테이</strong><span>가상 숙소 · 담당 윤호스트</span></div></div></div>
 <div class="workspace"><section class="workspace-main" aria-label="게스트 안부 현황">
 <div class="attention-banner"><span class="banner-icon">${icon(count?'bell':'check')}</span><div><h2>${count?'안부를 확인할 여행객이 '+count+'명 있어요':'지금은 확인할 여행객이 없어요'}</h2><p>${count?'약속한 시간이 지났어요. 가볍게 안부를 물어봐 주세요.':'다음 약속 시간이 되면 안부 요청이 표시돼요.'}</p></div>${count?button('확인하기 '+icon('arrow'),'detail','text','data-id="'+needs()[0].id+'"'):''}</div>
 <div class="stats"><div><span>오늘의 여행객</span><strong>3<small>명</small></strong></div><div><span>확인 필요 · 진행 중</span><strong class="orange">${count}<small>명</small></strong></div><div><span>응답 · 확인 완료</span><strong class="blue">${done}<small>명</small></strong></div></div>
 <section class="panel guest-list"><div class="panel-heading"><h2>여행객 안부</h2><span>11월 3일 · 가상 예약</span></div>
 <div class="filter-tabs" role="group" aria-label="안부 상태 필터">${[['all','전체',3],['need','확인 필요',count],['done','완료',done]].map(([key,label,n])=>'<button data-filter="'+key+'" class="'+(filter===key?'selected':'')+'" aria-pressed="'+(filter===key)+'">'+label+' <span>'+n+'</span></button>').join('')}</div>
 <div class="list-columns"><span>여행객</span><span>안부 약속</span><span>상태</span><span></span></div>
 <div class="rows">${rows.length?rows.map(g=>`<button class="guest-row" data-action="detail" data-id="${g.id}"><span class="guest-identity"><span class="avatar ${g.id}">${g.name.slice(1)}</span><span><strong>${g.name}</strong><small>${g.room} · 1인 여행</small></span></span><span class="appointment">${g.at?time(g.at):'—'}<small>${g.at?day(g.at):'아직 신청하지 않았어요'}</small></span>${badge(g.status)}${icon('arrow','row-arrow')}</button>`).join(''):'<div class="empty">'+icon('check')+'<h3>해당하는 여행객이 없어요</h3><p>다른 상태를 선택해 보세요.</p></div>'}</div>
 <div class="list-note">${icon('info')}응답 완료는 여행객의 자기보고이며, 실제 안전을 보장하지 않아요.</div></section>
 </section><aside class="side-column"><section class="panel guide-card"><span class="soft-icon">${icon('leaf')}</span><p class="eyebrow">A LITTLE CARE</p><h2>안부는 이렇게<br>이어져요</h2><ol class="steps"><li><span>1</span><div><strong>여행객이 직접 신청</strong><p>원하는 시간에 안부를 약속해요.</p></div></li><li><span>2</span><div><strong>약속한 시간에 응답</strong><p>‘괜찮아요’ 한 번이면 충분해요.</p></div></li><li><span>3</span><div><strong>미응답 시 담당자 확인</strong><p>15분 후 확인 필요로 표시해요.</p></div></li></ol><div class="guide-foot">위치나 움직임을 추적하지 않아요.</div></section>
 <section class="on-duty"><span class="duty-dot"></span><div><strong>윤호스트가 함께해요</strong><p>데모 대응 시간 18:00–23:00</p><span>실제 운영 시간과 절차는 검증 중이에요.</span></div></section></aside></div>`;
}
function guestView(){
 const g=state.guests.find(x=>x.id===selected),active=!terminal(g.status)&&g.status!=='unregistered',canRespond=['awaiting','needs_check','checking'].includes(g.status);
 return `<div class="guest-layout"><section class="guest-intro"><p class="eyebrow">FOR YOUR JOURNEY</p><h1>내 여행의 속도에<br>맞춰, 가벼운 안부</h1><p class="subtitle">혼자만의 시간은 그대로.<br>원할 때만 안부를 약속해 보세요.</p><div class="guest-switch"><label for="demo-guest">시연할 여행객</label><select id="demo-guest">${state.guests.map(x=>'<option value="'+x.id+'" '+(x.id===selected?'selected':'')+'>'+x.name+' · '+x.room+'</option>').join('')}</select></div><div class="intro-note">${icon('info')}신청·응답 정보는 이 탭 안에만 있어요.<br>새로고침하면 처음 상태로 돌아가요.</div></section>
 <section class="guest-phone" aria-label="여행객 안부 확인"><div class="phone-nav"><span>${icon('home')} 제주 동백 스테이</span><span class="badge neutral">DEMO</span></div>
 <div class="phone-content"><div class="greeting-art">${icon(['responded','resolved'].includes(g.status)?'check':'bubble')}</div><p class="eyebrow">${g.name}님의 안부</p><h2>${canRespond?'지금, 잘 지내고 있나요?':g.status==='scheduled'?'안부를 약속했어요':g.status==='responded'?'안부를 전했어요':g.status==='resolved'?'담당자가 확인했어요':g.status==='cancelled'?'신청을 취소했어요':'오늘 하루, 잘 지내고 있나요?'}</h2><p class="phone-description">${canRespond?'잠깐의 응답으로 호스트에게 안부를 전해 주세요.':g.status==='scheduled'?'약속한 시간에 이 화면에서 안부를 전해 주세요.':terminal(g.status)?'필요할 때 새로운 안부를 약속할 수 있어요.':'원하는 시간에 안부를 나눠요. 신청은 선택이에요.'}</p>
 ${g.status!=='unregistered'?'<div class="appointment-card"><span>안부 약속</span><strong>'+fmt(g.at)+'</strong>'+badge(g.status)+'</div>':''}
 ${(!active)?scheduleForm():''}
 <div class="host-info"><span class="avatar host-avatar">윤</span><div><strong>안부를 확인할 윤호스트</strong><p>대응 가능 시간 18:00–23:00</p></div></div>
 <details class="disclosure"><summary>어떤 정보가 공유되나요?</summary><p>담당자는 표시명, 약속 시각, 응답 여부와 조치 기록을 볼 수 있어요. 위치·객실 영상·연락처는 수집하지 않아요. 미응답 15분 후 담당자가 확인할 수 있어요. 취소하면 추가 요청은 멈추며, 데모 기록은 새로고침 또는 초기화할 때 삭제돼요.</p></details>
 </div><div class="phone-cta">${canRespond?button('괜찮아요 '+icon('check'),'respond','primary full','data-id="'+g.id+'"'):g.status==='scheduled'?'<div class="waiting-label">'+icon('clock')+' 약속한 시간을 기다리고 있어요</div>':button('안부 확인 신청하기','schedule','primary full','data-id="'+g.id+'"')}
 ${active?'<div class="secondary-actions">'+(['scheduled','awaiting'].includes(g.status)?button('시간 변경','reschedule','ghost','data-id="'+g.id+'"'):'')+button('신청 취소','cancel-prompt','ghost','data-id="'+g.id+'"')+'</div>':''}
 <p class="cta-note">이 데모는 실제 알림이나 긴급 대응을 제공하지 않아요.</p></div></section></div>`;
}
function dateInputValue(t){return new Date(t+9*3600_000).toISOString().slice(0,16);}
function nextAppointment(){
 const d=new Date(state.now+30*60_000+9*3600_000);
 const minutes=d.getUTCHours()*60+d.getUTCMinutes();
 if(minutes>22*60+45){d.setUTCDate(d.getUTCDate()+1);d.setUTCHours(18,0,0,0);}
 else if(minutes<18*60)d.setUTCHours(18,0,0,0);
 return d.getTime()-9*3600_000;
}
function scheduleForm(){
 return `<div class="schedule-form"><label for="appointment">언제 안부를 나눌까요?</label><input id="appointment" type="datetime-local" value="${dateInputValue(nextAppointment())}" min="${dateInputValue(state.now+60_000)}"><span class="field-hint">한국 시간 18:00–22:45 · 미응답 확인 시간 15분을 포함해요.</span><label class="checkbox-row"><input id="consent" type="checkbox"><span>담당자·공유 정보·미응답 후 절차를 확인했고,<br>선택형 안부 확인을 신청할게요.</span></label></div>`;
}
function componentsView(){
 return `<div class="page-heading"><div><p class="eyebrow">COMPONENT LIBRARY · V0.1</p><h1>가벼운 안부를 위한<br>일관된 디자인 언어</h1><p class="subtitle">TDS의 구성 패턴을 참고해 직접 만든 웹 컴포넌트예요.</p></div><span class="font-chip">Aa <b>Pretendard</b><small>Variable · 400 / 500 / 600 / 700</small></span></div>
 <div class="component-grid">
 <section class="panel specimen"><div class="specimen-title"><h2>Button</h2><span>01</span></div><p>한 화면에는 하나의 중요한 행동을 강조해요.</p><div class="sample-stack">${button('안부 전하기','sample','primary')}${button('시간 변경','sample','secondary')}${button('신청 취소','sample','ghost')}${button('응답 대기','sample','primary','disabled')}</div><div class="spec-caption">높이 48px · 모서리 12px · 터치 영역 44px 이상</div></section>
 <section class="panel specimen"><div class="specimen-title"><h2>Badge</h2><span>02</span></div><p>색과 문구를 함께 사용해 상태를 구분해요.</p><div class="sample-stack">${['scheduled','awaiting','needs_check','checking','responded','cancelled'].map(badge).join('')}</div><div class="spec-caption">중립 · 진행 · 주의 · 완료의 의미를 구분</div></section>
 <section class="panel specimen"><div class="specimen-title"><h2>Typography</h2><span>03</span></div><p>Pretendard의 명확한 위계로 정보를 전달해요.</p><div class="type-spec"><strong>오늘의 안부를 확인하세요</strong><span>여행을 잇는 작은 약속</span><p>원하는 시간에 가볍게 안부를 나눠요.</p><small>18:00–23:00 · 한국 시간 기준</small></div><div class="spec-caption">제목 32 / 24 · 본문 16 · 보조 14 / 12px</div></section>
 <section class="panel specimen"><div class="specimen-title"><h2>Color</h2><span>04</span></div><p>넓은 여백과 차분한 바탕, 선명한 핵심 행동.</p><div class="swatches">${[['#3182f6','Primary'],['#191f28','Text'],['#f2f4f6','Surface'],['#b85c00','Attention'],['#16815d','Complete']].map(([c,n])=>'<div><i style="background:'+c+'"></i><b>'+n+'</b><small>'+c+'</small></div>').join('')}</div></section>
 <section class="panel specimen"><div class="specimen-title"><h2>ListRow</h2><span>05</span></div><p>대상 → 핵심 정보 → 현재 상태 순서로 읽어요.</p><button class="sample-row" data-action="detail" data-id="g2"><span class="avatar g2">서준</span><span><strong>이서준</strong><small>동백 102 · 안부 19:50</small></span>${badge(state.guests[1].status)}${icon('arrow')}</button><div class="spec-caption">목록 전체 클릭 · 명확한 상세 진입 표시</div></section>
 <section class="panel specimen"><div class="specimen-title"><h2>Bottom CTA & Sheet</h2><span>06</span></div><p>다음 행동은 가까이에, 자세한 내용은 필요한 때.</p><div class="sample-cta">${button('여행객 화면 보기','go-guest','primary full')}${button('담당자 확인 시트 열기','detail','secondary full','data-id="g2"')}</div><div class="spec-caption">고정 하단 액션 · 키보드 이동 · Escape로 닫기</div></section></div>
 <p class="library-note">독립 구현 컴포넌트이며 토스·바카티오의 공식 제품이나 UI Kit이 아니에요.</p>`;
}
function openDialog(html){
 if(!$('#sheet').open)returnFocus=document.activeElement;
 $('#sheet').innerHTML=html;
 if(!$('#sheet').open)$('#sheet').showModal();
}
function closeDialog(){dialogGuest=null;$('#sheet').close();if(returnFocus?.isConnected)returnFocus.focus();else $('#main').querySelector('button,select,a')?.focus();}
function sheetHead(title){return '<div class="sheet-heading"><h2 id="sheet-title">'+title+'</h2>'+button(icon('close'),'close','icon-button','aria-label="닫기"')+'</div>';}
function showDetail(id,open=true){
 dialogGuest=id;const g=state.guests.find(x=>x.id===id);
 openDialog(sheetHead('여행객 안부 확인')+`<div class="detail-person"><span class="avatar ${g.id}">${g.name.slice(1)}</span><div><h3>${g.name}</h3><p>${g.room} · 가상 여행객</p></div>${badge(g.status)}</div><div class="detail-meta"><span>약속한 시간</span><strong>${g.at?fmt(g.at):'아직 신청하지 않았어요'}</strong><span>담당자</span><strong>윤호스트 · 18:00–23:00</strong></div>
 <h3 class="history-title">안부 기록</h3><ol class="history">${g.history.length?g.history.map(h=>'<li><span class="history-dot"></span><div>'+esc(h.text)+'<time>'+fmt(h.at)+'</time></div></li>').join(''):'<li class="muted">아직 안부 기록이 없어요.</li>'}</ol>
 ${g.status==='needs_check'?'<div class="inline-note">미응답은 위험을 의미하지 않아요. 담당자가 상황을 확인해 주세요.</div>'+button('확인 시작하기','start','primary full','data-id="'+g.id+'"'):''}
 ${g.status==='checking'?'<div class="detail-actions">'+button('연락 실패 기록 (가상)','contact','secondary full','data-id="'+g.id+'"')+'<label for="evidence">연락 결과와 확인 근거</label><textarea id="evidence" rows="3" placeholder="예: 가상 통화에서 본인 응답을 확인했어요."></textarea>'+button('근거를 남기고 확인 완료','resolve','primary full','data-id="'+g.id+'"')+'</div>':''}
 <p class="cta-note">가상 시연이에요. 실제 연락은 실행되지 않아요.</p>`);
}
document.addEventListener('click',e=>{
 const viewButton=e.target.closest('[data-view]');if(viewButton){view=viewButton.dataset.view;render();return;}
 const filterButton=e.target.closest('[data-filter]');if(filterButton){filter=filterButton.dataset.filter;render();return;}
 const b=e.target.closest('[data-action]');if(!b)return;
 const {action,id}=b.dataset;
 if(action==='advance'){act({type:'advance',minutes:Number(b.dataset.minutes)},'데모 시간을 이동했어요');return;}
 if(action==='reset'){state=initialState();filter='all';selected='g1';closeDialog();render();toast('가상 데이터와 시계를 초기화했어요');return;}
 if(action==='detail'){showDetail(id);return;}
 if(action==='close'){closeDialog();return;}
 if(action==='sample'){toast('컴포넌트의 클릭 상태예요');return;}
 if(action==='go-guest'){view='guest';render();return;}
 if(action==='schedule'||action==='save-time'){
   if(action==='schedule'&&!$('#consent').checked){toast('공유 정보와 후속 절차를 확인해 주세요');$('#consent').focus();return;}
   const input=$('#appointment'),at=Date.parse(input.value+':00+09:00');
   if(!Number.isFinite(at)||at<=state.now){toast('현재 데모 시각 이후로 선택해 주세요');input.focus();return;}
   try{state=transition(state,{type:'schedule',id,at});closeDialog();render();toast('안부 시간을 약속했어요');}catch(e){toast(e.message);input.focus();}return;
 }
 if(action==='reschedule'){openDialog(sheetHead('안부 시간 변경')+'<p class="sheet-description">이전 약속은 새 시간으로 바뀌어요.</p>'+scheduleForm().replace(/<label class="checkbox-row">[\s\S]*?<\/label>/,'')+button('새 시간으로 변경','save-time','primary full','data-id="'+id+'"'));return;}
 if(action==='cancel-prompt'){openDialog(sheetHead('안부 신청을 취소할까요?')+'<p class="sheet-description">이후 확인 요청은 중단돼요. 데모 기록은 새로고침 또는 초기화 전까지 남아 있어요.</p>'+button('신청 취소하기','cancel','primary full','data-id="'+id+'"')+button('계속 이용하기','close','ghost full'));return;}
 if(action==='cancel'){closeDialog();act({type:'cancel',id},'안부 신청을 취소했어요');return;}
 if(action==='resolve'){act({type:action,id,note:$('#evidence').value},'확인 결과를 기록했어요');return;}
 if(['respond','start','contact'].includes(action)){act({type:action,id},action==='respond'?'호스트에게 안부를 전했어요':action==='contact'?'연락 실패를 기록했어요. 확인 중 상태를 유지해요.':'담당자 확인을 시작했어요');}
});
document.addEventListener('change',e=>{if(e.target.id==='demo-guest'){selected=e.target.value;render();}});
$('#sheet').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
document.addEventListener('click',e=>{if(e.target.closest('.brand')){e.preventDefault();view='host';render();}});
render();
