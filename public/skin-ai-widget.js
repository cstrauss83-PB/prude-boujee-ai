(function(){

const API="https://prudeandboujee-chris-projects-773af4c9.vercel.app/api/skin-analysis";

const container=document.getElementById("pb-ai-skin");
if(!container)return;

container.innerHTML=`
<h2>Free Online AI Skin Consultation</h2>

<div id="uploadBox" style="border:2px dashed #e8c4b8;padding:30px;cursor:pointer;text-align:center;">
Upload Photo
</div>

<input type="file" id="fileInput" accept="image/*" style="display:none">

<img id="preview" style="max-width:200px;margin-top:20px;border-radius:10px">

<br><br>

<button id="analyzeBtn">Analyze My Skin</button>

<div id="loading" style="display:none;margin-top:20px;">Analyzing your skin...</div>

<div id="results"></div>
`;

let imageBase64=null;

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

document.getElementById("preview").src=compressed;

};

img.src=evt.target.result;

};

reader.readAsDataURL(file);

});

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
<h3>Glass Skin Score: ${r.skinScore.glassSkinScore}</h3>
<p>Hydration: ${r.skinScore.hydration}</p>
<p>Texture: ${r.skinScore.texture}</p>
<p>Clarity: ${r.skinScore.clarity}</p>
<p>Barrier: ${r.skinScore.barrier}</p>
`;

}

html+=`<p>${r.analysisText||""}</p>`;

if(r.products){

html+="<h3>Recommended Products</h3>";

r.products.forEach(p=>{

html+=`
<div>
<strong>${p.brand}</strong><br>
${p.name}<br>
${p.why}<br>
<a href="${p.url}" target="_blank">Shop</a>
</div>
`;

});

}

document.getElementById("results").innerHTML=html;

}

})();
