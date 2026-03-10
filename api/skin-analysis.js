(function(){

const container = document.getElementById("pb-ai-skin");
if(!container) return;

container.innerHTML = `
<style>

#pb-ai-skin{
font-family: Arial, sans-serif;
background:#fdf7f2;
padding:40px 20px;
max-width:820px;
margin:auto;
text-align:center;
color:#3a2a25;
}

#pb-ai-skin h2{
font-weight:300;
font-size:38px;
margin-bottom:10px;
}

#pb-ai-skin .subtitle{
color:#8c7466;
margin-bottom:30px;
}

#pb-ai-skin .upload{
border:2px dashed #e8d5c9;
padding:40px;
cursor:pointer;
background:white;
border-radius:16px;
}

#pb-ai-skin .upload:hover{
border-color:#c4786e;
}

#pb-ai-skin button{
background:#3a2a25;
color:white;
border:none;
padding:14px 24px;
margin-top:20px;
cursor:pointer;
border-radius:8px;
font-size:14px;
}

#pb-ai-skin button:hover{
background:#c4786e;
}

#pb-ai-skin img{
max-width:100%;
margin-top:20px;
border-radius:10px;
}

#pb-ai-skin .card{
background:white;
border-radius:16px;
padding:24px;
margin-top:25px;
box-shadow:0 5px 20px rgba(0,0,0,0.06);
text-align:left;
}

#pb-ai-skin .metric-grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:10px;
margin-top:15px;
}

#pb-ai-skin .metric{
background:#f7e8e4;
padding:10px;
border-radius:10px;
text-align:center;
font-size:14px;
}

#pb-ai-skin .products{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
gap:15px;
margin-top:10px;
}

#pb-ai-skin .product{
border:1px solid #eee;
padding:12px;
border-radius:10px;
}

</style>

<h2>Free Online AI Skin Consultation</h2>
<p class="subtitle">Let us help you glow!</p>

<div class="upload" id="uploadBox">Upload Photo</div>
<input type="file" id="fileInput" accept="image/*" style="display:none">

<img id="preview">

<br>
<button id="analyzeBtn">Analyze My Skin</button>

<div id="loading" style="display:none;margin-top:20px;">Analyzing your skin...</div>

<div id="results"></div>
`;

let imageBase64 = null;

document.getElementById("uploadBox").onclick = () => {
document.getElementById("fileInput").click();
};

document.getElementById("fileInput").addEventListener("change", e => {

const file = e.target.files[0];
const reader = new FileReader();

reader.onload = function(evt){

const img = new Image();

img.onload = function(){

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const maxWidth = 800;
const scale = maxWidth / img.width;

canvas.width = maxWidth;
canvas.height = img.height * scale;

ctx.drawImage(img,0,0,canvas.width,canvas.height);

const compressed = canvas.toDataURL("image/jpeg",0.7);

imageBase64 = compressed.split(",")[1];

document.getElementById("preview").src = compressed;

};

img.src = evt.target.result;

};

reader.readAsDataURL(file);

});

document.getElementById("analyzeBtn").onclick = async () => {

if(!imageBase64){
alert("Please upload a photo first.");
return;
}

document.getElementById("loading").style.display="block";

try{

const res = await fetch(
"https://prudeandboujee-chris-projects-773af4c9.vercel.app/api/skin-analysis",
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body: JSON.stringify({ imageBase64 })
});

const data = await res.json();

document.getElementById("loading").style.display="none";

renderResults(data);

}catch(err){

console.error(err);
document.getElementById("loading").innerText="Error analyzing skin.";

}

};

function renderResults(r){

let html = "";

html += '<div class="card">';
html += '<h3>Skin Analysis</h3>';

html += '<div class="metric-grid">';
html += '<div class="metric">'+(r.skinType || '')+'<br>Skin Type</div>';
html += '<div class="metric">'+(r.hydrationLevel || '')+'<br>Hydration</div>';
html += '<div class="metric">'+(r.textureScore || '')+'<br>Texture</div>';
html += '<div class="metric">'+(r.overallHealth || '')+'<br>Health</div>';
html += '</div>';

html += '<p style="margin-top:15px">'+(r.analysisText || '')+'</p>';
html += '</div>';

if(r.routine){

html += '<div class="card"><h3>Your Routine</h3>';

for(let i=0;i<r.routine.length;i++){

const step = r.routine[i];

html += '<p><strong>'+step.step+'. '+step.name+'</strong><br>'+step.why+'</p>';

}

html += '</div>';

}

if(r.products){

html += '<div class="card"><h3>Recommended Products</h3><div class="products">';

for(let i=0;i<r.products.length;i++){

const p = r.products[i];

html += '<div class="product">';
html += '<strong>'+p.brand+'</strong><br>';
html += p.name;
html += '<p>'+p.why+'</p>';
html += '<a href="https://www.prudeandboujee.com/search?q='+encodeURIComponent(p.name)+'" target="_blank">Shop</a>';
html += '</div>';

}

html += '</div></div>';

}

document.getElementById("results").innerHTML = html;

}

})();
