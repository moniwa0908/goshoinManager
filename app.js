
const STORAGE_KEY = 'goshoin-manager-v1';

const seedAirports = [
  {name:'羽田空港', code:'HND', pref:'東京都'},
  {name:'大阪国際空港（伊丹）', code:'ITM', pref:'大阪府'},
  {name:'松山空港', code:'MYJ', pref:'愛媛県'},
  {name:'徳島空港', code:'TKS', pref:'徳島県'},
  {name:'福岡空港', code:'FUK', pref:'福岡県'},
  {name:'那覇空港', code:'OKA', pref:'沖縄県'},
  {name:'新千歳空港', code:'CTS', pref:'北海道'},
  {name:'中部国際空港', code:'NGO', pref:'愛知県'},
  {name:'高松空港', code:'TAK', pref:'香川県'},
  {name:'高知空港', code:'KCZ', pref:'高知県'},
  {name:'新潟空港', code:'KIJ', pref:'新潟県'},
  {name:'函館空港', code:'HKD', pref:'北海道'},
  {name:'釧路空港', code:'KUH', pref:'北海道'},
  {name:'旭川空港', code:'AKJ', pref:'北海道'},
  {name:'帯広空港', code:'OBO', pref:'北海道'},
  {name:'女満別空港', code:'MMB', pref:'北海道'},
  {name:'青森空港', code:'AOJ', pref:'青森県'},
  {name:'成田国際空港', code:'NRT', pref:'千葉県'},
  {name:'出雲空港', code:'IZO', pref:'島根県'},
  {name:'広島空港', code:'HIJ', pref:'広島県'},
  {name:'北九州空港', code:'KKJ', pref:'福岡県'},
  {name:'宮崎空港', code:'KMI', pref:'宮崎県'},
  {name:'大分空港', code:'OIT', pref:'大分県'},
  {name:'鹿児島空港', code:'KOJ', pref:'鹿児島県'},
  {name:'長崎空港', code:'NGS', pref:'長崎県'},
  {name:'熊本空港', code:'KMJ', pref:'熊本県'},
  {name:'札幌丘珠空港', code:'OKD', pref:'北海道'},
  {name:'三沢空港', code:'MSJ', pref:'青森県'},
  {name:'仙台空港', code:'SDJ', pref:'宮城県'},
  {name:'小松空港', code:'KMQ', pref:'石川県'},
  {name:'花巻空港', code:'HNA', pref:'岩手県'},
  {name:'山形空港', code:'GAJ', pref:'山形県'},
  {name:'秋田空港', code:'AXT', pref:'秋田県'},
  {name:'山口宇部空港', code:'UBJ', pref:'山口県'},
  {name:'岡山空港', code:'OKJ', pref:'岡山県'},
  {name:'但馬空港', code:'TJH', pref:'兵庫県'},
  {name:'関西国際空港', code:'KIX', pref:'大阪府'},
  {name:'南紀白浜空港', code:'SHM', pref:'和歌山県'},
  {name:'利尻空港', code:'RIS', pref:'北海道'},
  {name:'奥尻空港', code:'OIR', pref:'北海道'},
  {name:'隠岐空港', code:'OKI', pref:'島根県'},
  {name:'奄美空港', code:'ASJ', pref:'鹿児島県'},
  {name:'種子島空港', code:'TNE', pref:'鹿児島県'},
  {name:'屋久島空港', code:'KUM', pref:'鹿児島県'},
  {name:'徳之島空港', code:'TKN', pref:'鹿児島県'},
  {name:'与論空港', code:'RNJ', pref:'鹿児島県'},
  {name:'喜界空港', code:'KKX', pref:'鹿児島県'},
  {name:'沖永良部空港', code:'OKE', pref:'鹿児島県'},
  {name:'石垣空港', code:'ISG', pref:'沖縄県'},
  {name:'与那国空港', code:'OGN', pref:'沖縄県'},
  {name:'久米島空港', code:'UEO', pref:'沖縄県'},
  {name:'南大東空港', code:'MMD', pref:'沖縄県'},
  {name:'北大東空港', code:'KTD', pref:'沖縄県'},
  {name:'多良間空港', code:'TRA', pref:'沖縄県'},
  {name:'宮古空港', code:'MMY', pref:'沖縄県'},
  {name:'根室中標津空港', code:'SHB', pref:'北海道'}
].map((a,i)=>({
  id:'seed-'+i, ...a, collected:false, memo:'', lastCollectedAt:null, createdAt:i
}));

let state = loadState();
let activeFilter = 'all';
let sortMode = 'created';
let editingId = null;

function loadState(){
  let loaded = null;
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed.airports)) loaded = parsed;
    }
  }catch(e){}

  if(!loaded){
    loaded = {airports: JSON.parse(JSON.stringify(seedAirports))};
  } else {
    // 既存データを残したまま、不足している公式56空港を自動追加
    const existingKeys = new Set(
      loaded.airports.map(a => (a.code || '').trim().toUpperCase()).filter(Boolean)
    );
    let maxCreated = Math.max(-1, ...loaded.airports.map(a => a.createdAt ?? 0));

    seedAirports.forEach(seed => {
      const code = (seed.code || '').trim().toUpperCase();
      if(!existingKeys.has(code)){
        loaded.airports.push({
          ...JSON.parse(JSON.stringify(seed)),
          id: 'seed-merge-' + code,
          createdAt: ++maxCreated
        });
        existingKeys.add(code);
      }
    });
  }

  // 既存データに内部取得日時がない場合は補完
  loaded.airports.forEach(a => {
    if(!('lastCollectedAt' in a)) a.lastCollectedAt = null;
  });

  // マージ後の内容を保存
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
  }catch(e){}
  return loaded;
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
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.nav==='airports'){
    activeFilter='all';
    document.querySelectorAll('.filter-btn').forEach(x=>{
      x.classList.toggle('active', x.dataset.filter==='all');
    });
  }
  navTo(b.dataset.nav);
}));

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
    .sort((a,b)=>(b.lastCollectedAt||0)-(a.lastCollectedAt||0))
    .slice(0,5);

  const el = document.getElementById('recentList');
  if(!recent.length){
    el.innerHTML = '<div class="empty-card">まだ取得済みの御翔印はありません。</div>';
  } else {
    el.innerHTML = recent.map(a=>`
      <button class="recent-card" onclick="openAirport('${a.id}')">
        <div class="recent-thumb" style="display:grid;place-items:center;color:#9f3b2e;font-weight:800;">翔</div>
        <div class="recent-info">
          <strong>${esc(a.name)}</strong>
          <small>${esc(a.code || '---')}</small>
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
  document.getElementById('dialogTitle').textContent='空港詳細';
  document.getElementById('airportId').value=a.id;
  document.getElementById('airportName').value=a.name||'';
  document.getElementById('airportCode').value=a.code||'';
  document.getElementById('airportPref').value=a.pref||'';
  document.getElementById('airportCollected').checked=!!a.collected;
  document.getElementById('airportMemo').value=a.memo||'';
  document.getElementById('deleteAirportBtn').style.display='block';
  dialog.showModal();
}
window.openAirport=openAirport;

function openNewAirport(){
  editingId=null;
  document.getElementById('dialogTitle').textContent='空港を追加';
  document.getElementById('airportId').value='';
  document.getElementById('airportName').value='';
  document.getElementById('airportCode').value='';
  document.getElementById('airportPref').value='';
  document.getElementById('airportCollected').checked=false;
  document.getElementById('airportMemo').value='';
  document.getElementById('deleteAirportBtn').style.display='none';
  dialog.showModal();
}
document.getElementById('quickAddBtn').addEventListener('click',openNewAirport);
document.getElementById('addAirportBtn').addEventListener('click',openNewAirport);
document.getElementById('closeDialogBtn').addEventListener('click',()=>dialog.close());



document.getElementById('airportForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  const data={
    name:document.getElementById('airportName').value.trim(),
    code:document.getElementById('airportCode').value.trim().toUpperCase(),
    pref:document.getElementById('airportPref').value.trim(),
    collected:document.getElementById('airportCollected').checked,
    memo:document.getElementById('airportMemo').value.trim(),
  };
  if(!data.name) return;
  if(editingId){
    const a=state.airports.find(x=>x.id===editingId);
    const wasCollected = !!a.collected;
    const nowCollected = !!data.collected;

    if(!wasCollected && nowCollected){
      data.lastCollectedAt = Date.now();
    }else if(wasCollected && !nowCollected){
      data.lastCollectedAt = null;
    }else{
      data.lastCollectedAt = a.lastCollectedAt ?? null;
    }

    Object.assign(a,data);
  }else{
    state.airports.push({
      id:'custom-'+Date.now(),
      ...data,
      lastCollectedAt: data.collected ? Date.now() : null,
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
