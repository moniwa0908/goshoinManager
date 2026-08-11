
const STORAGE_KEY = 'goshoin-manager-v1';

const seedAirports = [
  {name:'新千歳空港', code:'CTS', pref:'北海道'},
  {name:'函館空港', code:'HKD', pref:'北海道'},
  {name:'青森空港', code:'AOJ', pref:'青森県'},
  {name:'仙台空港', code:'SDJ', pref:'宮城県'},
  {name:'成田国際空港', code:'NRT', pref:'千葉県'},
  {name:'羽田空港', code:'HND', pref:'東京都'},
  {name:'新潟空港', code:'KIJ', pref:'新潟県'},
  {name:'富山空港', code:'TOY', pref:'富山県'},
  {name:'小松空港', code:'KMQ', pref:'石川県'},
  {name:'中部国際空港', code:'NGO', pref:'愛知県'},
  {name:'大阪国際空港（伊丹）', code:'ITM', pref:'大阪府'},
  {name:'関西国際空港', code:'KIX', pref:'大阪府'},
  {name:'神戸空港', code:'UKB', pref:'兵庫県'},
  {name:'岡山空港', code:'OKJ', pref:'岡山県'},
  {name:'広島空港', code:'HIJ', pref:'広島県'},
  {name:'高松空港', code:'TAK', pref:'香川県'},
  {name:'松山空港', code:'MYJ', pref:'愛媛県'},
  {name:'高知空港', code:'KCZ', pref:'高知県'},
  {name:'福岡空港', code:'FUK', pref:'福岡県'},
  {name:'北九州空港', code:'KKJ', pref:'福岡県'},
  {name:'長崎空港', code:'NGS', pref:'長崎県'},
  {name:'熊本空港', code:'KMJ', pref:'熊本県'},
  {name:'大分空港', code:'OIT', pref:'大分県'},
  {name:'宮崎空港', code:'KMI', pref:'宮崎県'},
  {name:'鹿児島空港', code:'KOJ', pref:'鹿児島県'},
  {name:'那覇空港', code:'OKA', pref:'沖縄県'}
].map((a,i)=>({
  id:'seed-'+i, ...a, collected:false, date:'', memo:'', photo:'', createdAt:i
}));

let state = loadState();
let activeFilter = 'all';
let sortMode = 'created';
let editingId = null;
let tempPhoto = '';

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed.airports)) return parsed;
    }
  }catch(e){}
  return {airports: JSON.parse(JSON.stringify(seedAirports))};
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}
function esc(s=''){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function navTo(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(view+'View').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  if(view==='airports') renderAirportList();
  window.scrollTo({top:0,behavior:'instant'});
}
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.view)));
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.nav)));

function renderHome(){
  const total = state.airports.length;
  const done = state.airports.filter(a=>a.collected).length;
  const pct = total ? Math.round(done/total*100) : 0;
  document.getElementById('homeCollected').textContent = done;
  document.getElementById('homeTotal').textContent = total;
  document.getElementById('homePercent').textContent = pct+'%';
  document.getElementById('homeProgress').style.width = pct+'%';

  const recent = state.airports
    .filter(a=>a.collected)
    .sort((a,b)=>(b.date||'').localeCompare(a.date||''))
    .slice(0,5);

  const el = document.getElementById('recentList');
  if(!recent.length){
    el.innerHTML = '<div class="empty-card">まだ取得済みの御翔印はありません。</div>';
  } else {
    el.innerHTML = recent.map(a=>`
      <button class="recent-card" onclick="openAirport('${a.id}')">
        ${a.photo ? `<img class="recent-thumb" src="${a.photo}" alt="">` : `<div class="recent-thumb" style="display:grid;place-items:center;color:#9f3b2e;font-weight:800;">翔</div>`}
        <div class="recent-info">
          <strong>${esc(a.name)}</strong>
          <small>${esc(a.code || '---')} ${a.date ? '・ '+esc(a.date) : ''}</small>
        </div>
        <span class="chev">›</span>
      </button>`).join('');
  }
}

function currentList(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  let list = state.airports.filter(a=>{
    const matchQ = !q || [a.name,a.code,a.pref].some(v=>(v||'').toLowerCase().includes(q));
    const matchF = activeFilter==='all' || (activeFilter==='collected' ? a.collected : !a.collected);
    return matchQ && matchF;
  });
  if(sortMode==='name'){
    list.sort((a,b)=>a.name.localeCompare(b.name,'ja'));
  } else if(sortMode==='code'){
    list.sort((a,b)=>(a.code||'ZZZ').localeCompare(b.code||'ZZZ'));
  } else {
    list.sort((a,b)=>(a.createdAt??0)-(b.createdAt??0));
  }
  return list;
}

function renderAirportList(){
  const list = currentList();
  document.getElementById('listSummary').textContent = `${list.length}件`;
  const el = document.getElementById('airportList');
  if(!list.length){
    el.innerHTML = '<div class="empty-card">該当する空港はありません。</div>';
    return;
  }
  el.innerHTML = list.map(a=>`
    <button class="airport-item" onclick="openAirport('${a.id}')">
      <span class="status-dot ${a.collected?'done':''}">${a.collected?'✓':''}</span>
      <span class="airport-main">
        <strong>${esc(a.name)}</strong>
        <small>${esc(a.code || '---')} ${a.pref ? '・ '+esc(a.pref) : ''}</small>
      </span>
      <span class="chev">›</span>
    </button>`).join('');
}

function renderAll(){
  renderHome();
  renderAirportList();
}

document.getElementById('searchInput').addEventListener('input',renderAirportList);
document.querySelectorAll('.filter-btn').forEach(b=>b.addEventListener('click',()=>{
  activeFilter=b.dataset.filter;
  document.querySelectorAll('.filter-btn').forEach(x=>x.classList.toggle('active',x===b));
  renderAirportList();
}));
document.getElementById('sortBtn').addEventListener('click',()=>{
  sortMode = sortMode==='created' ? 'name' : sortMode==='name' ? 'code' : 'created';
  const labels={created:'登録順',name:'空港名順',code:'コード順'};
  document.getElementById('sortBtn').textContent='並び替え：'+labels[sortMode];
  renderAirportList();
});
document.getElementById('uncollectedQuick').addEventListener('click',()=>{
  activeFilter='uncollected';
  document.querySelectorAll('.filter-btn').forEach(x=>x.classList.toggle('active',x.dataset.filter==='uncollected'));
  navTo('airports');
});

const dialog=document.getElementById('airportDialog');
function openAirport(id){
  const a=state.airports.find(x=>x.id===id);
  if(!a) return;
  editingId=id;
  tempPhoto=a.photo||'';
  document.getElementById('dialogTitle').textContent='空港詳細';
  document.getElementById('airportId').value=a.id;
  document.getElementById('airportName').value=a.name||'';
  document.getElementById('airportCode').value=a.code||'';
  document.getElementById('airportPref').value=a.pref||'';
  document.getElementById('airportCollected').checked=!!a.collected;
  document.getElementById('airportDate').value=a.date||'';
  document.getElementById('airportMemo').value=a.memo||'';
  document.getElementById('deleteAirportBtn').style.display='block';
  updatePhotoPreview();
  dialog.showModal();
}
window.openAirport=openAirport;

function openNewAirport(){
  editingId=null;
  tempPhoto='';
  document.getElementById('dialogTitle').textContent='空港を追加';
  document.getElementById('airportId').value='';
  document.getElementById('airportName').value='';
  document.getElementById('airportCode').value='';
  document.getElementById('airportPref').value='';
  document.getElementById('airportCollected').checked=false;
  document.getElementById('airportDate').value='';
  document.getElementById('airportMemo').value='';
  document.getElementById('deleteAirportBtn').style.display='none';
  updatePhotoPreview();
  dialog.showModal();
}
document.getElementById('quickAddBtn').addEventListener('click',openNewAirport);
document.getElementById('addAirportBtn').addEventListener('click',openNewAirport);
document.getElementById('closeDialogBtn').addEventListener('click',()=>dialog.close());

document.getElementById('airportCollected').addEventListener('change',e=>{
  const date=document.getElementById('airportDate');
  if(e.target.checked && !date.value) date.value=new Date().toISOString().slice(0,10);
});

document.getElementById('photoInput').addEventListener('change',async(e)=>{
  const f=e.target.files?.[0];
  if(!f) return;
  tempPhoto=await resizeImage(f,1200,0.82);
  updatePhotoPreview();
  e.target.value='';
});
document.getElementById('removePhotoBtn').addEventListener('click',()=>{
  tempPhoto='';
  updatePhotoPreview();
});
function updatePhotoPreview(){
  const img=document.getElementById('photoPreview');
  const ph=document.getElementById('photoPlaceholder');
  const rm=document.getElementById('removePhotoBtn');
  if(tempPhoto){
    img.src=tempPhoto; img.style.display='block'; ph.style.display='none'; rm.style.display='inline-block';
  }else{
    img.removeAttribute('src'); img.style.display='none'; ph.style.display='flex'; rm.style.display='none';
  }
}
function resizeImage(file,maxSide,quality){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        let {width,height}=img;
        const scale=Math.min(1,maxSide/Math.max(width,height));
        width=Math.round(width*scale); height=Math.round(height*scale);
        const canvas=document.createElement('canvas');
        canvas.width=width; canvas.height=height;
        canvas.getContext('2d').drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.onerror=reject; img.src=reader.result;
    };
    reader.onerror=reject; reader.readAsDataURL(file);
  });
}

document.getElementById('airportForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const data={
    name:document.getElementById('airportName').value.trim(),
    code:document.getElementById('airportCode').value.trim().toUpperCase(),
    pref:document.getElementById('airportPref').value.trim(),
    collected:document.getElementById('airportCollected').checked,
    date:document.getElementById('airportDate').value,
    memo:document.getElementById('airportMemo').value.trim(),
    photo:tempPhoto
  };
  if(!data.name) return;
  if(editingId){
    const a=state.airports.find(x=>x.id===editingId);
    Object.assign(a,data);
  }else{
    state.airports.push({
      id:'custom-'+Date.now(),
      ...data,
      createdAt:Math.max(-1,...state.airports.map(a=>a.createdAt??0))+1
    });
  }
  saveState();
  dialog.close();
});

document.getElementById('deleteAirportBtn').addEventListener('click',()=>{
  if(!editingId) return;
  if(confirm('この空港を削除しますか？')){
    state.airports=state.airports.filter(a=>a.id!==editingId);
    saveState();
    dialog.close();
  }
});

document.getElementById('exportBtn').addEventListener('click',()=>{
  const payload={app:'御翔印帳',version:1,exportedAt:new Date().toISOString(),data:state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`goshoin_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('importInput').addEventListener('change',async(e)=>{
  const file=e.target.files?.[0];
  if(!file) return;
  try{
    const parsed=JSON.parse(await file.text());
    const incoming=parsed?.data?.airports ? parsed.data : parsed;
    if(!Array.isArray(incoming.airports)) throw new Error();
    if(confirm('現在のデータをバックアップ内容で置き換えますか？')){
      state=incoming;
      saveState();
      alert('バックアップを読み込みました。');
    }
  }catch(err){
    alert('バックアップファイルを読み込めませんでした。');
  }
  e.target.value='';
});

document.getElementById('resetBtn').addEventListener('click',()=>{
  if(confirm('登録内容を消して初期データに戻しますか？')){
    state={airports:JSON.parse(JSON.stringify(seedAirports))};
    saveState();
  }
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
}
renderAll();
