(function(){

const API="https://prudeandboujee-chris-projects-773af4c9.vercel.app/api/skin-analysis";

const container=document.getElementById("pb-ai-skin");
if(!container)return;

container.innerHTML=`
<style>
#pb-ai-skin{
font-family:Arial,sans-serif;
background:#fdf7f2;
padding:40px 20px;
max-width:820px;
margin:auto;
text-align:center;
color:#3a2a25;
}

#pb-ai-skin h2{
font-size:36px;
font-weight:300;
margin-bottom:10px;
}

.upload{
border:2px dashed #e8c4b8;
padding:30px;
cursor:pointer;
border-radius:16px;
background:white;
}

.upload:hover{
border-color:#c4786a;
}

button{
background:#2c1810;
color:white;
border:none;
padding:14px 26px;
border-radius:8px;
cursor:pointer;
margin-top:20px;
}

button:hover{
background:#c4786a;
}

.preview-wrap{
position:relative;
display:inline-block;
margin-top:20px;
}

#preview{
max-width:250px;
border-radius:12px;
}

#overlay{
position:absolute;
top:0;
left:0;
pointer-events:none;
}

.card{
background:white;
border-radius:14px;
padding:20px;
margin-top:25px;
text-align:left;
box-shadow:0 4px 14px rgba(0,0,0,0.08);
}

.metric-grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:10px;
margin-top:10px;
}

.metric{
background:#f7e8e4;
padding:10px;
border-radius:8px;
text-align:center;
font-size:13px;
}

.products{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
gap:12px;
margin-top:10px;
}

.product{
border:1px solid #eee;
padding:12px;
border-radius:8px;
}
</style>

<h2>AI Skin Consultation</h2>

<div class="upload" id="uploadBox">
Upload Photo
</div>

<input type="file" id="fileInput" accept="image/*" style="display:none">

<div class="preview-wrap">
<img id="preview">
<canvas id="overlay"></canvas>
</div>

<br>

<button id="analyzeBtn">Analyze My Skin</button>

<div id="loading" style="display:none;margin-top:20px;">
Analyzing your skin...
</div>

<div id="results"></div>
`;

let imageBase64=null;

const preview=document.getElementById("preview");
const overlay=document.getElementById("overlay");

document.getElementById("uploadBox").onclick=()=>{
document.getElementById("fileInput").click();
};

document.getElementById("fileInput").addEventListener("change",e=>{

const file=e.target.files[0];
const reader=new FileReader();

reader.onload=function(evt){

const img=new Image();

img.onload=function(){

const canvas=document.createElement("canvas");
const ctx=canvas.getContext("2d");

const maxWidth=800;
const scale=maxWidth/img.width;

canvas.width=maxWidth;
canvas.height=img.height*scale;

ctx.drawImage(img,0,0,canvas.width,canvas.height);

const compressed=canvas.toDataURL("image/jpeg",0.7);

imageBase64=compressed.split(",")[1];

preview.src=compressed;

drawOverlay(canvas);

};

img.src=evt.target.result;

};

reader.readAsDataURL(file);

});

function drawOverlay(canvas){

const ctx=overlay.getContext("2d");

overlay.width=canvas.width;
overlay.height=canvas.height;

overlay.style.width=preview.width+"px";
overlay.style.height=preview.height+"px";

const data=canvas.getContext("2d").getImageData(0,0,canvas.width,canvas.height).data;

for(let i=0;i<data.length;i+=4){

const r=data[i];
const g=data[i+1];
const b=data[i+2];

const redness=r-g;

if(redness>45){

const pixel=i/4;
const x=pixel%canvas.width;
const y=Math.floor(pixel/canvas.width);

ctx.beginPath();
ctx.arc(x,y,2,0,2*Math.PI);
ctx.fillStyle="rgba(255,0,0,0.4)";
ctx.fill();

}

}

}

document.getElementById("analyzeBtn").onclick=async()=>{

if(!imageBase64){
alert("Please upload a photo first.");
return;
}

document.getElementById("loading").style.display="block";

try{

const res=await fetch(API,{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify({imageBase64})
});

const data=await res.json();

renderResults(data);

}catch(err){

console.error(err);
document.getElementById("loading").innerText="Error analyzing skin.";

}

};

function renderResults(r){

document.getElementById("loading").style.display="none";

let html="";

if(r.skinScore){

html+=`
<div class="card">
<h3>Glass Skin Score: ${r.skinScore.glassSkinScore}</h3>

<div class="metric-grid">
<div class="metric">Hydration<br>${r.skinScore.hydration}</div>
<div class="metric">Texture<br>${r.skinScore.texture}</div>
<div class="metric">Clarity<br>${r.skinScore.clarity}</div>
<div class="metric">Barrier<br>${r.skinScore.barrier}</div>
</div>

</div>
`;

}

html+=`
<div class="card">
<h3>Skin Analysis</h3>
<p>${r.analysisText||""}</p>
</div>
`;

if(r.products){

html+=`<div class="card"><h3>Recommended Products</h3><div class="products">`;

r.products.forEach(p=>{

html+=`
<div class="product">
<strong>${p.brand}</strong><br>
${p.name}<br>
<p>${p.why}</p>
<a href="${p.url}" target="_blank">Shop</a>
</div>
`;

});

html+=`</div></div>`;

}

document.getElementById("results").innerHTML=html;

}

})();
