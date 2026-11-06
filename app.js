/* Lettre au Père Noël — site partagé (Firebase jojo-cooker, collection « noel ») */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const FB='https://www.gstatic.com/firebasejs/10.12.2/';
const FB_AI='https://www.gstatic.com/firebasejs/11.10.0/';
const LETTRE='noel/lettre', JOUETS='noel/lettre/jouets';
const DEF={msg:"Je m'appelle Johan et j'ai 14 mois. C'est mon tout premier Noël où je comprends un peu ce qui se passe ! Cette année j'ai été très sage (enfin, presque). Papa et maman t'ont aidé à écrire cette lettre. Voici ce qui me ferait plaisir :",signe:"Johan",age:"14 mois"};
const store={db:null,user:null,unsubs:[],toys:[],letter:{...DEF}};
const status=t=>{$("#status").textContent=t};
const firstName=u=>((u&&u.displayName)||((u&&u.email)||"").split("@")[0]||"").split(/\s+/)[0];
function loadScript(src){return new Promise((ok,ko)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=ko;document.head.append(s)})}
function loadImg(src){return new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=src})}

/* ---------- Décor ---------- */
(function seyes(){const c=document.createElement("canvas");c.width=32;c.height=32;const x=c.getContext("2d");
  x.fillStyle="#fffdf7";x.fillRect(0,0,32,32);x.fillStyle="rgba(120,150,210,.28)";[7,15,23].forEach(y=>x.fillRect(0,y,32,1));
  x.fillStyle="rgba(150,110,190,.45)";x.fillRect(0,31,32,1);x.fillRect(31,0,1,32);$("#lettre").style.backgroundImage="url("+c.toDataURL()+")"})();
const mois=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const d=new Date();$("#date").textContent="Le "+d.getDate()+" "+mois[d.getMonth()]+" "+d.getFullYear();
(function grib(){const c=document.createElement("canvas");c.width=340;c.height=220;const x=c.getContext("2d");
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  [["#c8202f",3],["#2b7a3d",4],["#1f3a8a",3]].forEach(([col,w],k)=>{x.strokeStyle=col;x.lineWidth=w;x.lineCap="round";x.lineJoin="round";x.globalAlpha=.85;x.beginPath();
    let px=90+k*70,py=110;x.moveTo(px,py);
    for(let i=0;i<26;i++){px=Math.max(15,Math.min(325,px+(rnd()-.5)*110));py=Math.max(15,Math.min(205,py+(rnd()-.5)*90));x.quadraticCurveTo(px+(rnd()-.5)*40,py+(rnd()-.5)*40,px,py)}
    x.stroke()});
  x.globalAlpha=1;x.font="46px serif";x.fillText("⭐",250,60);$("#gribouillis").src=c.toDataURL()})();

/* ---------- Découpe façon magazine ---------- */
const cutCache={};
async function cutout(t){
  const key=t.id+"|"+(t.img?t.img.length:0)+"|"+t.emoji;
  if(cutCache[key])return cutCache[key];
  const S=440,m=26,c=document.createElement("canvas");c.width=S;c.height=S;const x=c.getContext("2d");
  let seed=0;for(const ch of t.id)seed=(seed*31+ch.charCodeAt(0))%2147483647;seed=seed||1;
  const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const pts=[],j=()=>(rnd()-.5)*7;const L=m+j(),T=m+j(),R=S-m+j(),B=S-m+j();
  const edge=(x1,y1,x2,y2)=>{const n=14;for(let i=0;i<n;i++){const f=i/n;pts.push([x1+(x2-x1)*f+j()*.6,y1+(y2-y1)*f+j()*.6])}};
  edge(L,T,R,T+j());edge(R,T,R+j(),B);edge(R,B,L,B+j());edge(L,B,L+j(),T);
  const path=()=>{x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath()};
  x.save();x.shadowColor="rgba(40,30,20,.35)";x.shadowBlur=14;x.shadowOffsetX=4;x.shadowOffsetY=6;path();x.fillStyle="#fff";x.fill();x.restore();
  x.save();path();x.clip();const inner=[L+12,T+12,R-L-24,B-T-24];let drawn=false;
  if(t.img){try{const im=await loadImg(t.img);x.fillStyle="#fbfbf8";x.fillRect(...inner);
      const sc=Math.min(inner[2]/im.width,inner[3]/im.height),w=im.width*sc,h=im.height*sc;
      x.drawImage(im,inner[0]+(inner[2]-w)/2,inner[1]+(inner[3]-h)/2,w,h);drawn=true}catch(e){}}
  if(!drawn){const pal=[["#ffe3e6","#ffc2c9"],["#e2f0ff","#bcd9ff"],["#e6f7e8","#c0e8c6"],["#fff1cc","#ffe08a"]];const p=pal[Math.floor(rnd()*pal.length)];
    const g=x.createLinearGradient(0,inner[1],0,inner[1]+inner[3]);g.addColorStop(0,p[0]);g.addColorStop(1,p[1]);x.fillStyle=g;x.fillRect(...inner);
    x.fillStyle="rgba(255,255,255,.55)";for(let i=0;i<28;i++){x.beginPath();x.arc(inner[0]+rnd()*inner[2],inner[1]+rnd()*inner[3],2+rnd()*4,0,7);x.fill()}
    x.font="190px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',serif";x.textAlign="center";x.textBaseline="middle";x.fillText(t.emoji||"🎁",S/2,S/2+10)}
  x.restore();path();x.strokeStyle="rgba(0,0,0,.08)";x.lineWidth=1.5;x.stroke();
  return cutCache[key]=c.toDataURL("image/png");
}

/* ---------- Rendu ---------- */
let photoTarget=null,renderSeq=0;
async function render(){
  const seq=++renderSeq,box=$("#jouets");
  const toys=store.toys.slice().sort((a,b)=>(a.at||"").localeCompare(b.at||""));
  const frag=document.createDocumentFragment();
  if(!toys.length){const v=document.createElement("div");v.className="vide";v.textContent="Ajoute une première capture d'écran dans l'atelier ↑";frag.append(v)}
  for(const t of toys){
    const f=document.createElement("figure");f.className="cut";f.style.setProperty("--r",(t.r||0)+"deg");f.style.setProperty("--tr",(-(t.r||0)*1.5-3)+"deg");
    f.innerHTML='<span class="tape"></span><span class="pic"><img alt=""></span><figcaption><span class="label" contenteditable="true" spellcheck="false"></span><span class="tools"></span></figcaption>';
    const img=f.querySelector("img");img.src=await cutout(t);img.alt=t.name||"";
    if(seq!==renderSeq)return;
    const lab=f.querySelector(".label");lab.textContent=t.name||"";
    lab.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();lab.blur()}});
    lab.addEventListener("blur",()=>{const v=lab.textContent.trim();if(v&&v!==t.name)saveToy(t.id,{name:v})});
    const tools=f.querySelector(".tools");
    if(t.by){const s=document.createElement("span");s.className="by";s.textContent=t.by;tools.append(s)}
    if(t.url){const a=document.createElement("a");a.href=t.url;a.target="_blank";a.rel="noopener";a.className="by";a.textContent="lien ↗";tools.append(a)}
    const ph=document.createElement("button");ph.type="button";ph.textContent=t.img?"Photo":"Ajouter une photo";
    ph.onclick=()=>{photoTarget=t;$("#cardPhoto").value="";$("#cardPhoto").click()};
    const del=document.createElement("button");del.type="button";del.className="del";del.textContent="Retirer";del.setAttribute("aria-label","Retirer "+(t.name||"ce jouet"));
    let armed=false;del.onclick=()=>{if(!armed){armed=true;del.textContent="Sûr ?";setTimeout(()=>{armed=false;del.textContent="Retirer"},3000);return}removeToy(t.id)};
    tools.append(ph,del);frag.append(f);
  }
  if(seq!==renderSeq)return;
  const editing=box.contains(document.activeElement);if(editing)return; // on ne casse pas une saisie en cours
  box.replaceChildren(frag);
  const per={};toys.forEach(t=>{if(t.by)per[t.by]=(per[t.by]||0)+1});
  $("#counts").textContent=Object.entries(per).map(([k,v])=>k+" : "+v).join(" · ");
}
function renderLetter(){
  for(const k of ["msg","signe","age"]){const el=$("#"+k);if(document.activeElement!==el&&el.innerText.replace(/\n$/,"")!==(store.letter[k]||""))el.textContent=store.letter[k]||""}
}

/* ---------- Écriture Firestore ---------- */
function saveToy(id,data){if(!store.db)return Promise.reject(new Error("offline"));return store.db.doc(JOUETS+"/"+id).set(data,{merge:true}).catch(e=>{status("Pas enregistré : vérifie la connexion ou les règles Firestore.");throw e})}
function removeToy(id){if(store.db)store.db.doc(JOUETS+"/"+id).delete().catch(()=>status("Suppression impossible pour l'instant."))}
const timers={};
["msg","signe","age"].forEach(k=>{const el=$("#"+k);
  el.addEventListener("input",()=>{clearTimeout(timers[k]);timers[k]=setTimeout(()=>{const v=el.innerText.replace(/\n$/,"");store.letter[k]=v;if(store.db)store.db.doc(LETTRE).set({[k]:v,at:new Date().toISOString()},{merge:true}).catch(()=>{})},700)})});
$("#msg").addEventListener("paste",e=>{const tx=e.clipboardData&&e.clipboardData.getData("text/plain");if(tx){e.preventDefault();document.execCommand("insertText",false,tx)}});

/* ---------- Gemini (Firebase AI Logic) : reconnaissance des captures ---------- */
let modelP=null;
function model(){
  if(!modelP)modelP=(async()=>{
    const app=await import(FB_AI+"firebase-app.js"),ac=await import(FB_AI+"firebase-app-check.js"),ai=await import(FB_AI+"firebase-ai.js");
    let a=app.getApps().find(x=>x.name==="ia");
    if(!a){a=app.initializeApp(window.FIREBASE_CONFIG,"ia");
      if(window.RECAPTCHA_KEY)ac.initializeAppCheck(a,{provider:new ac.ReCaptchaEnterpriseProvider(window.RECAPTCHA_KEY),isTokenAutoRefreshEnabled:true});}
    const inst=ai.getAI(a,{backend:new ai.GoogleAIBackend()});
    return ai.getGenerativeModel(inst,{model:"gemini-flash-lite-latest",generationConfig:{responseMimeType:"application/json",temperature:.2}});
  })().catch(e=>{modelP=null;throw e});
  return modelP;
}
function slugName(raw){
  let u;try{u=new URL(raw.trim())}catch(e){return ""}
  const segs=u.pathname.split("/").filter(Boolean).map(s=>{try{return decodeURIComponent(s)}catch(e){return s}});
  let cand="";const i=segs.findIndex(s=>s==="dp"||s==="gp");if(i>0)cand=segs[i-1];
  if(!cand)cand=segs.filter(s=>/[a-zà-ÿ]{3,}/i.test(s)&&/[-_+ ]/.test(s)).sort((a,b)=>b.length-a.length)[0]||"";
  cand=cand.replace(/\.(html?|aspx|php)$/i,"").replace(/[-_+]+/g," ").replace(/\b[a-z]*\d{5,}[a-z0-9]*\b/gi,"").replace(/\s+/g," ").trim();
  if(cand.length>70)cand=cand.slice(0,70).replace(/\s\S*$/,"");return cand?cand[0].toUpperCase()+cand.slice(1):"";
}
function canvasOf(im,maxSide,box){const [sx,sy,sw,sh]=box||[0,0,im.width,im.height];const sc=Math.min(1,maxSide/Math.max(sw,sh));
  const c=document.createElement("canvas");c.width=Math.max(1,Math.round(sw*sc));c.height=Math.max(1,Math.round(sh*sc));
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);return c}
let aiWarned=false,lastAiErr="";
async function analyze(file,url){
  const src=URL.createObjectURL(file);
  try{
    const im=await loadImg(src),slug=url?slugName(url):"";let out=null;
    try{
      const m=await model();
      const b64=canvasOf(im,1536).toDataURL("image/jpeg",.88).split(",")[1];
      const prompt="L'image est une capture d'écran (souvent de téléphone) d'une page produit d'un site marchand, ou une photo d'un jouet. "+
        (slug?"Indice tiré du lien du produit : \""+slug+"\". ":"")+
        "1) Identifie le jouet ou cadeau principal. 2) Trouve la photo principale du produit (pas le texte, les prix, les boutons ni les bandeaux) et donne son cadre serré au format [ymin, xmin, ymax, xmax] normalisé de 0 à 1000. "+
        "Réponds en JSON : {\"name\": nom court en français, 2 à 6 mots, sans âge ni référence (marque seulement si courte et connue), \"emoji\": un seul emoji, \"box_2d\": [ymin, xmin, ymax, xmax] ou null}.";
      const r=await Promise.race([m.generateContent([prompt,{inlineData:{mimeType:"image/jpeg",data:b64}}]),new Promise((_,ko)=>setTimeout(()=>ko(new Error("Gemini met trop de temps à répondre")),30000))]);
      let txt=r.response.text().trim().replace(/^```(json)?|```$/g,"");out=JSON.parse(txt);if(Array.isArray(out))out=out[0];
    }catch(e){console.warn("IA",e);lastAiErr=String(e&&e.message||e);if(!aiWarned){aiWarned=true;status("Reconnaissance automatique indisponible : "+(/config not found/i.test(lastAiErr)?"Gemini est en cours d'activation côté Firebase, réessaie dans quelques minutes.":/quota|429/i.test(lastAiErr)?"quota gratuit de Gemini atteint pour le moment.":lastAiErr.slice(0,140))+" La photo entière est utilisée.")}}
    let box=null;const b=out&&out.box_2d;
    if(Array.isArray(b)&&b.length===4&&b.every(v=>isFinite(+v))){
      let [y0,x0,y1,x1]=b.map(v=>+v/1000);const p=.012;
      x0=Math.max(0,x0-p);y0=Math.max(0,y0-p);x1=Math.min(1,x1+p);y1=Math.min(1,y1+p);
      if(x1-x0>.05&&y1-y0>.03)box=[x0*im.width,y0*im.height,(x1-x0)*im.width,(y1-y0)*im.height];
    }
    return {ok:!!(out&&out.name),name:String((out&&out.name)||slug||"Mon cadeau").slice(0,60),emoji:out&&out.emoji?String(out.emoji).slice(0,4):"🎁",img:canvasOf(im,640,box).toDataURL("image/jpeg",.85)};
  }finally{URL.revokeObjectURL(src)}
}

/* ---------- Ajouts ---------- */
const queue=[];let busy=false;
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const rot=()=>Math.round(((Math.random()*2-1)*4)*10)/10;
function dupOf(name){const n=name.toLowerCase();return store.toys.find(t=>(t.name||"").toLowerCase()===n)}
function enqueue(files){
  if(!store.db){status("Connecte-toi d'abord.");return}
  files=[...files].filter(f=>/^image\//.test(f.type));if(!files.length)return;
  const url=$("#url").value.trim();$("#url").value="";
  files.forEach((f,i)=>queue.push({f,url:i===0?url:""}));pump();
}
async function pump(){
  if(busy)return;busy=true;let n=0;aiWarned=false;
  while(queue.length){const {f,url}=queue.shift();n++;
    status("✂︎ Les lutins découpent la capture "+n+(queue.length?" (encore "+queue.length+")":"")+"…");
    try{const res=await analyze(f,url),dup=dupOf(res.name);
      await saveToy(newId(),{name:res.name,emoji:res.emoji,url,img:res.img,r:rot(),by:firstName(store.user),byEmail:store.user.email,at:new Date().toISOString()});
      status(dup?"« "+res.name+" » était déjà sur la lettre"+(dup.by?" (ajouté par "+dup.by+")":"")+" : retire un des deux si c'est un doublon.":res.ok?"« "+res.name+" » est collé dans la lettre ✓":"Photo collée sans reconnaissance ("+(/config not found/i.test(lastAiErr)?"Gemini pas encore prêt côté Firebase":lastAiErr?lastAiErr.slice(0,120):"nom non trouvé")+"). Touche l'étiquette pour écrire le nom.");
    }catch(e){status("Cette image n'a pas pu être ajoutée.")}}
  busy=false;
}
$("#photo").addEventListener("change",e=>{enqueue(e.target.files);e.target.value=""});
$("#drop").addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();$("#photo").click()}});
$("#drop").addEventListener("dragover",e=>{e.preventDefault();$("#drop").classList.add("drag")});
$("#drop").addEventListener("dragleave",()=>$("#drop").classList.remove("drag"));
$("#drop").addEventListener("drop",e=>{e.preventDefault();$("#drop").classList.remove("drag");enqueue(e.dataTransfer.files)});
document.addEventListener("paste",e=>{if(e.target.closest&&e.target.closest("[contenteditable]"))return;
  const fs=[...(e.clipboardData?.files||[])].filter(f=>/^image\//.test(f.type));if(fs.length){e.preventDefault();enqueue(fs)}});
$("#cardPhoto").addEventListener("change",async e=>{const f=e.target.files[0],t=photoTarget;if(!f||!t)return;status("✂︎ Découpe de la photo…");
  try{const res=await analyze(f,t.url||"");await saveToy(t.id,{img:res.img});status("Photo remplacée ✓")}catch(err){status("Cette image n'a pas pu être lue.")}});
$("#addForm").addEventListener("submit",async e=>{e.preventDefault();
  if(!store.db){status("Connecte-toi d'abord.");return}
  const url=$("#url").value.trim(),typed=$("#name").value.trim();
  if(!url&&!typed){status("Ajoute une capture d'écran, ou colle un lien ou un nom.");return}
  if(url&&!/^https?:\/\//i.test(url)){status("Ce lien doit commencer par https://");return}
  const name=typed||slugName(url);
  if(!name){status("Ce lien court ne contient pas le nom du jouet : écris-le dans « Nom ».");$("#name").focus();return}
  $("#addBtn").disabled=true;
  try{await saveToy(newId(),{name,emoji:"🎁",url,img:null,r:rot(),by:firstName(store.user),byEmail:store.user.email,at:new Date().toISOString()});
    $("#url").value="";$("#name").value="";status("« "+name+" » est ajouté. Pour sa vraie photo, touche « Ajouter une photo » sous le jouet.")}catch(err){}
  $("#addBtn").disabled=false});

/* ---------- Export / partage ---------- */
async function snapshot(){await document.fonts.ready;const el=$("#lettre");el.classList.add("exporting");document.activeElement&&document.activeElement.blur();
  try{return await html2canvas(el,{scale:2,backgroundColor:"#fffdf7",logging:false})}finally{el.classList.remove("exporting")}}
const fileBase=()=>"Lettre au Pere Noel"+(store.letter.signe?" - "+store.letter.signe.replace(/[^\p{L}\p{N} -]/gu,""):"");
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
async function shareOrDownload(blob,name,mime,okMsg){
  const file=new File([blob],name,{type:mime});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:"Lettre au Père Noël"});status(okMsg);return}catch(e){if(e&&e.name==="AbortError"){status("Partage annulé.");return}}}
  download(blob,name);status(okMsg);
}
$("#pdfBtn").onclick=async()=>{const b=$("#pdfBtn");b.disabled=true;status("Mise en page du PDF…");
  try{const cv=await snapshot(),{jsPDF}=window.jspdf,pdf=new jsPDF({unit:"mm",format:"a4"});
    const W=210,H=297,mg=8,w=W-2*mg,ppm=cv.width/w,pageH=Math.floor((H-2*mg)*ppm);
    for(let y=0,first=true;y<cv.height;y+=pageH,first=false){const h=Math.min(pageH,cv.height-y),pc=document.createElement("canvas");pc.width=cv.width;pc.height=h;
      pc.getContext("2d").drawImage(cv,0,y,cv.width,h,0,0,cv.width,h);if(!first)pdf.addPage();pdf.addImage(pc.toDataURL("image/jpeg",.92),"JPEG",mg,mg,w,h/ppm)}
    download(pdf.output("blob"),fileBase()+".pdf");status("PDF prêt ✓")}catch(e){status("Le PDF n'a pas pu être créé.")}
  b.disabled=false};
$("#shareBtn").onclick=async()=>{const b=$("#shareBtn");b.disabled=true;status("Préparation de l'image…");
  try{const cv=await snapshot(),blob=await new Promise(r=>cv.toBlob(r,"image/png"));await shareOrDownload(blob,fileBase()+".png","image/png","Image prête ✓")}catch(e){status("L'image n'a pas pu être créée.")}
  b.disabled=false};
/* ---------- Partage de la vidéo : une copie image de la lettre, lisible par lien ---------- */
function randId(){const a=new Uint8Array(12);crypto.getRandomValues(a);return [...a].map(b=>b.toString(36).padStart(2,"0")).join("").slice(0,20)}
$("#videoBtn").onclick=async()=>{
  if(!store.db){status("Connecte-toi d'abord.");return}
  const b=$("#videoBtn");b.disabled=true;status("Préparation de la vidéo…");
  try{
    const cv=await snapshot();
    const W=900,sc=Math.min(1,W/cv.width),c=document.createElement("canvas");c.width=Math.round(cv.width*sc);c.height=Math.round(cv.height*sc);
    const x=c.getContext("2d");x.fillStyle="#fffdf7";x.fillRect(0,0,c.width,c.height);x.drawImage(cv,0,0,c.width,c.height);
    let q=.85,img=c.toDataURL("image/jpeg",q);while(img.length>900000&&q>.4){q-=.1;img=c.toDataURL("image/jpeg",q)}
    let id=store.letter.shareId;
    if(!id){id=randId();await store.db.doc(LETTRE).set({shareId:id},{merge:true});store.letter.shareId=id}
    await store.db.doc("partage/"+id).set({img,w:c.width,h:c.height,signe:store.letter.signe||"",at:new Date().toISOString()});
    const url=new URL("video.html?l="+id,location.href).href;
    try{if(navigator.share){await navigator.share({title:"Une lettre pour le Père Noël",text:"Regarde la lettre de "+(store.letter.signe||"Johan")+" au Père Noël 🎅",url});status("Vidéo partagée ✓ Le lien montre la lettre telle qu'elle est maintenant.");b.disabled=false;return}}
    catch(e){if(e&&e.name==="AbortError"){status("Partage annulé. Le lien est prêt : "+url);b.disabled=false;return}}
    try{await navigator.clipboard.writeText(url);status("Lien copié ✓ "+url)}catch(e){status("Lien de la vidéo : "+url)}
  }catch(e){console.error(e);status(/permission/i.test(String(e&&e.message))?"Partage refusé par Firebase : la règle « partage » n'est pas encore en place.":"La vidéo n'a pas pu être préparée.")}
  b.disabled=false;
};
$("#copyBtn").onclick=async()=>{const L=store.letter,toys=store.toys.slice().sort((a,b)=>(a.at||"").localeCompare(b.at||""));
  const txt="🎅 Lettre au Père Noël"+(L.signe?" de "+L.signe:"")+(L.age?" ("+L.age+")":"")+"\n\n"+toys.map((t,i)=>(i+1)+". "+t.name+(t.url?"\n   "+t.url:"")).join("\n");
  try{if(navigator.share&&/iPhone|iPad|Android/.test(navigator.userAgent)){await navigator.share({text:txt});return}}catch(e){if(e&&e.name==="AbortError")return}
  try{await navigator.clipboard.writeText(txt);status("Liste copiée ✓")}catch(e){status("Copie impossible sur ce navigateur.")}};

/* ---------- Connexion Google + synchro (comme Jojo cooker) ---------- */
function gateMsg(t){$("#gateMsg").textContent=t}
function authErr(e){const c=(e&&e.code)||"";
  if(c==="auth/unauthorized-domain")return "Ce site n'est pas autorisé dans Firebase : Authentication → Paramètres → Domaines autorisés → ajouter cedriccovarel92.github.io.";
  if(c==="auth/popup-closed-by-user"||c==="auth/cancelled-popup-request")return "Connexion annulée.";
  if(c==="auth/network-request-failed")return "Pas de connexion internet.";
  return "Connexion impossible ("+(c||"erreur")+").";}
function setSync(on,u){const s=$("#sync");s.classList.toggle("off",!on);s.textContent=on?"Synchronisé · "+firstName(u):"Hors ligne"}
function subscribe(db){
  const u1=db.doc(LETTRE).onSnapshot(s=>{store.letter={...DEF,...(s.exists?s.data():{})};renderLetter()},()=>setSync(false));
  const u2=db.collection(JOUETS).onSnapshot(s=>{store.toys=s.docs.map(d=>({id:d.id,...d.data()}));render()},()=>setSync(false));
  return [u1,u2];
}
async function boot(){
  const cfg=window.FIREBASE_CONFIG;
  try{await loadScript(FB+"firebase-app-compat.js");await loadScript(FB+"firebase-auth-compat.js");await loadScript(FB+"firebase-firestore-compat.js")}
  catch(e){gateMsg("Impossible de charger Firebase. Vérifie la connexion puis recharge la page.");return}
  firebase.initializeApp(cfg);
  const db=firebase.firestore();db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  const auth=firebase.auth();auth.getRedirectResult().catch(e=>gateMsg(authErr(e)));
  const btn=$("#gateBtn"),alt=$("#gateAlt");btn.hidden=false;gateMsg("");
  const mkProv=()=>{const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:"select_account"});return p};
  if(/FBAN|FBAV|Instagram|Line\/|; wv\)|Snapchat|Messenger|GSA\//.test(navigator.userAgent||""))gateMsg("Ce navigateur intégré bloque la connexion Google. Ouvre le site dans Safari ou Chrome.");
  let wait=null;
  btn.onclick=async()=>{gateMsg("Ouverture de la fenêtre Google…");clearTimeout(wait);
    wait=setTimeout(()=>{if(!auth.currentUser){alt.hidden=false;gateMsg("Rien ne s'ouvre ? Autorise les pop-up pour ce site, ou touche « Autre méthode de connexion ».")}},7000);
    try{await auth.signInWithPopup(mkProv());clearTimeout(wait)}
    catch(e){clearTimeout(wait);alt.hidden=false;
      if(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment"){gateMsg("Redirection vers Google…");return auth.signInWithRedirect(mkProv())}
      gateMsg(authErr(e))}};
  alt.onclick=()=>{gateMsg("Redirection vers Google…");auth.signInWithRedirect(mkProv()).catch(e=>gateMsg(authErr(e)))};
  $("#logout").onclick=()=>auth.signOut();
  auth.onAuthStateChanged(async u=>{
    store.unsubs.forEach(f=>{try{f()}catch(e){}});store.unsubs=[];store.db=null;store.user=null;
    if(!u){$("#gate").hidden=false;setSync(false);return}
    const email=(u.email||"").toLowerCase(),allowed=(window.ALLOWED_EMAILS||[]).map(e=>String(e).toLowerCase().trim());
    if(allowed.length&&!allowed.includes(email)){gateMsg("Le compte "+u.email+" n'est pas sur la liste des accès.");await auth.signOut();return}
    try{await db.doc(LETTRE).get()}catch(e){gateMsg("Le compte "+u.email+" n'a pas accès à la lettre : ajoute la règle « noel » dans Firestore (voir README).");await auth.signOut();return}
    store.user=u;store.db=db;$("#gate").hidden=true;setSync(true,u);store.unsubs=subscribe(db);
  });
}
renderLetter();render();boot();
})();
