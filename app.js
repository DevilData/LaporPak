const STORAGE_KEY = "laporpak.domains.v1";
const countryNames = {ID:"Indonesia",MY:"Malaysia",SG:"Singapura",PH:"Filipina",TH:"Thailand",VN:"Vietnam",US:"Amerika Serikat",ALL:"Semua Negara"};
const countryFlags = {ID:"🇮🇩",MY:"🇲🇾",SG:"🇸🇬",PH:"🇵🇭",TH:"🇹🇭",VN:"🇻🇳",US:"🇺🇸",ALL:"🌍"};
const adTypeNames = {all:"Semua Iklan",image:"Gambar",video:"Video",carousel:"Carousel",lead:"Lead Ads",ctwa:"Click to WhatsApp"};
const statusNames = {active:"Aktif",inactive:"Tidak Ditemukan",pending:"Belum Dicek",error:"Gagal Dicek"};
const initialRecords = [
  {id:crypto.randomUUID(),label:"Contoh Domain Aktif",domain:"contoh.com",country:"ID",adType:"all",status:"active",activeAds:4,lastChecked:new Date().toISOString()},
  {id:crypto.randomUUID(),label:"Target Baru",domain:"targetbaru.id",country:"ID",adType:"video",status:"pending",activeAds:0,lastChecked:null}
];

const $ = selector => document.querySelector(selector);
const modal = $("#domain-modal");
let records = loadRecords();

function loadRecords(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialRecords; }
  catch { return initialRecords; }
}
function saveRecords(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(records)); }
function cleanDomain(value){ return value.trim().toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,"").split("/")[0]; }
function escapeHtml(value){ return String(value).replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char])); }
function formatDate(value){ if(!value)return "—"; return new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)); }
function adLibraryUrl(record){ const query=encodeURIComponent(record.domain); return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${record.country}&q=${query}&search_type=keyword_unordered&media_type=all`; }
function toast(message){ const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2600); }

function render(){
  const query=$("#search").value.trim().toLowerCase();
  const filter=$("#status-filter").value;
  const visible=records.filter(item=>(filter==="all"||item.status===filter)&&(!query||item.domain.includes(query)||item.label.toLowerCase().includes(query)));
  $("#stat-total").textContent=records.length;
  $("#stat-active").textContent=records.filter(x=>x.status==="active").length;
  $("#stat-inactive").textContent=records.filter(x=>x.status==="inactive").length;
  $("#stat-pending").textContent=records.filter(x=>x.status==="pending"||x.status==="error").length;
  $("#domain-list").innerHTML=visible.map(item=>`<tr>
    <td class="domain-cell"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.domain)}</small></td>
    <td><span class="flag">${countryFlags[item.country]||"🌍"} ${countryNames[item.country]||item.country}</span></td>
    <td>${adTypeNames[item.adType]||item.adType}</td>
    <td><span class="badge ${item.status}">${statusNames[item.status]}</span></td>
    <td>${item.status==="active"?item.activeAds:"—"}</td>
    <td>${formatDate(item.lastChecked)}</td>
    <td><div class="actions">
      <button class="action" data-action="open" data-id="${item.id}" title="Buka Ad Library">↗</button>
      <button class="action" data-action="cycle" data-id="${item.id}" title="Ubah status manual">✓</button>
      <button class="action" data-action="edit" data-id="${item.id}" title="Edit">✎</button>
      <button class="action danger" data-action="delete" data-id="${item.id}" title="Hapus">×</button>
    </div></td>
  </tr>`).join("");
  $("#empty-state").hidden=visible.length!==0;
  $("table").hidden=visible.length===0;
}

function openModal(record=null){
  $("#domain-form").reset(); $("#record-id").value=record?.id||""; $("#modal-title").textContent=record?"Edit Domain":"Tambah Domain";
  if(record){ $("#label").value=record.label; $("#domain").value=record.domain; $("#country").value=record.country; $("#ad-type").value=record.adType; $("#manual-status").value=record.status; }
  modal.showModal(); setTimeout(()=>$("#label").focus(),0);
}
function closeModal(){ modal.close(); }

$("#domain-form").addEventListener("submit",event=>{
  event.preventDefault(); const id=$("#record-id").value; const domain=cleanDomain($("#domain").value);
  if(!domain.includes(".")){ toast("Masukkan domain yang valid."); return; }
  const existing=records.find(item=>item.id===id);
  const next={id:id||crypto.randomUUID(),label:$("#label").value.trim(),domain,country:$("#country").value,adType:$("#ad-type").value,status:$("#manual-status").value,activeAds:existing?.activeAds||0,lastChecked:existing?.lastChecked||null};
  records=id?records.map(item=>item.id===id?next:item):[next,...records]; saveRecords(); render(); closeModal(); toast(id?"Domain diperbarui.":"Domain ditambahkan.");
});

$("#domain-list").addEventListener("click",event=>{
  const button=event.target.closest("button[data-action]"); if(!button)return; const record=records.find(item=>item.id===button.dataset.id); if(!record)return;
  if(button.dataset.action==="open") window.open(adLibraryUrl(record),"_blank","noopener");
  if(button.dataset.action==="edit") openModal(record);
  if(button.dataset.action==="cycle"){
    const sequence=["pending","active","inactive","error"]; const next=sequence[(sequence.indexOf(record.status)+1)%sequence.length];
    record.status=next; record.lastChecked=new Date().toISOString(); record.activeAds=next==="active"?Math.max(1,record.activeAds||1):0; saveRecords(); render(); toast(`Status menjadi: ${statusNames[next]}`);
  }
  if(button.dataset.action==="delete"&&confirm(`Hapus ${record.domain} dari daftar?`)){ records=records.filter(item=>item.id!==record.id); saveRecords(); render(); toast("Domain dihapus."); }
});

$("#open-modal").addEventListener("click",()=>openModal()); $("#empty-add").addEventListener("click",()=>openModal()); $("#focus-add").addEventListener("click",()=>openModal());
$("#close-modal").addEventListener("click",closeModal); $("#cancel-modal").addEventListener("click",closeModal);
$("#search").addEventListener("input",render); $("#status-filter").addEventListener("change",render);
modal.addEventListener("click",event=>{ if(event.target===modal)closeModal(); });
render();
