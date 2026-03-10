(function(){

const container = document.getElementById("pb-ai-skin");

container.innerHTML = `
<style>
#pb-ai-skin{
font-family:Arial,sans-serif;
background:#fdf7f2;
padding:40px 20px;
max-width:800px;
margin:auto;
text-align:center;
}
.upload{
border:2px dashed #e8d5c9;
padding:40px;
cursor:pointer;
background:white;
border-radius:16px;
}
button{
background:#3a2a25;
color:white;
border:none;
padding:14px 24px;
margin-top:20px;
cursor:pointer;
border-radius:8px;
}
.result{
margin-top:30px;
}
</style>

<h2>AI Skin Consultation</h2>

<div class="upload" id="upload">Upload Photo</div>
<input type="file" id="file" style="display:none">

<img id="preview" style="max-width:100%;margin-top:20px;border-radius:10px">

<br>
<button id="analyze">Analyze My Skin</button>

<div id="loading" style="display:none;margin-top:20px">Analyzing...</div>

<div class="result" id="result"></div>
`;

let imageBase64 = null;

document.getElementById("upload").onclick = () => {
document.getElementById("file").click();
};

document.getElementById("file").addEventListener("change", e => {

const file = e.target.files[0];
const reader = new FileReader();

reader.onload = evt => {
imageBase64 = evt.target.result.split(",")[1];
document.getElementById("preview").src = evt.target.result;
};

reader.readAsDataURL(file);

});

document.getElementById("analyze").onclick = async () => {

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

document.getElementById("result").innerHTML =
"<pre>"+JSON.stringify(data,null,2)+"</pre>";

}catch(err){

console.error(err);
document.getElementById("loading").innerText="Error analyzing skin.";

}

};

})();
