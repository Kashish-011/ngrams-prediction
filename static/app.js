let corpus = document.getElementById("corpus").value;
let modelData = null;
let currentTab = "unigram";
let scene, camera, renderer, points, lineGroup, animationId;

// Never let the decorative splash screen block the application.
window.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("pageLoader");
    if (loader) setTimeout(() => loader.classList.add("hide"), 900);
    const cursorGlow = document.getElementById("cursorGlow");
    window.addEventListener("pointermove", e => {
        if (!cursorGlow) return;
        cursorGlow.style.left = e.clientX + "px";
        cursorGlow.style.top = e.clientY + "px";
        cursorGlow.style.opacity = "1";
    });
});

document.getElementById("charCount").textContent = `${corpus.length} characters`;
document.getElementById("corpus").addEventListener("input", e => {
    document.getElementById("charCount").textContent = `${e.target.value.length} characters`;
});

function scrollToId(id){document.getElementById(id).scrollIntoView({behavior:"smooth"});}
function loadDemo(){document.getElementById("corpus").value = document.getElementById("corpus").defaultValue; document.getElementById("charCount").textContent=`${document.getElementById("corpus").value.length} characters`; analyze();}

async function analyze(){
    const text = document.getElementById("corpus").value;
    const loading = document.getElementById("loading");
    loading.classList.remove("hidden");
    try{
        const res = await fetch("/api/analyze", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                corpus:text,
                removePunctuation:document.getElementById("punctuation").checked,
                maxNodes:55
            })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error || "Analysis failed");
        modelData = data;
        renderStats(data.stats);
        renderTable();
        renderConstellation(data);
        document.getElementById("topWord").textContent = data.unigram[0]?.word || "—";
    }catch(e){ alert(e.message); }
    finally{ loading.classList.add("hidden"); }
}

function renderStats(s){
    const items=[
        ["TOKENS",s.tokens,"Processed tokens"],
        ["VOCABULARY",s.vocabulary,"Unique words"],
        ["BIGRAMS",s.bigrams,"Unique pairs"],
        ["TRIGRAMS",s.trigrams,"Unique triples"],
        ["DIVERSITY",s.density.toFixed(1)+"%","Vocabulary density"]
    ];
    document.getElementById("stats").innerHTML=items.map(x=>`
        <div class="stat"><small>${x[0]}</small><strong>${x[1]}</strong><span>${x[2]}</span></div>
    `).join("");
}

const formulas={
    unigram:"P(w) = Count(w) / Total Tokens",
    bigram:"P(w₂ | w₁) = Count(w₁,w₂) / Count(w₁)",
    trigram:"P(w₃ | w₁,w₂) = Count(w₁,w₂,w₃) / Count(w₁,w₂)"
};

document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click",()=>{
        document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        currentTab=btn.dataset.tab;
        renderTable();
    });
});

function renderTable(){
    if(!modelData)return;
    document.getElementById("formula").textContent=formulas[currentTab];
    let rows=[], headers=[];
    if(currentTab==="unigram"){
        headers=["WORD","COUNT","PROBABILITY"];
        rows=modelData.unigram.map(x=>[x.word,x.count,(x.probability*100).toFixed(2)+"%"]);
    }else if(currentTab==="bigram"){
        headers=["PREVIOUS","NEXT","COUNT","PROBABILITY"];
        rows=modelData.bigram.map(x=>[x.previous,x.next,x.count,(x.probability*100).toFixed(2)+"%"]);
    }else{
        headers=["CONTEXT","NEXT","COUNT","PROBABILITY"];
        rows=modelData.trigram.map(x=>[x.context,x.next,x.count,(x.probability*100).toFixed(2)+"%"]);
    }
    document.getElementById("tableWrap").innerHTML=`
      <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${escapeHtml(String(v))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

function renderConstellation(data){
    const container=document.getElementById("threeCanvas");
    const labelLayer=document.getElementById("nodeLabels");
    const inspector=document.getElementById("nodeInspector");
    container.innerHTML="";
    labelLayer.innerHTML="";
    inspector.classList.add("hidden");
    if(animationId)cancelAnimationFrame(animationId);

    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(52,container.clientWidth/container.clientHeight,.1,1000);
    camera.position.set(0,0,17);

    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setSize(container.clientWidth,container.clientHeight);
    container.appendChild(renderer.domElement);

    const nodes=data.nodes || [];
    const nodeIndex={};
    const positions=[];

    // NLP-driven layout: frequency determines radial importance, while
    // outgoing transition degree determines the orbit/ring of each token.
    const maxFreq=Math.max(...nodes.map(n=>n.frequency),1);
    const maxDegree=Math.max(...nodes.map(n=>n.degree),1);
    nodes.forEach((node,i)=>{
        const rank=i;
        const ring=Math.floor(rank/7);
        const angle=(i%7)*(Math.PI*2/7) + ring*.72;
        const freqRatio=node.frequency/maxFreq;
        const degreeRatio=node.degree/maxDegree;
        const radius=1.35 + ring*1.25 + (1-freqRatio)*.55;
        const p=new THREE.Vector3(
            radius*Math.cos(angle),
            radius*Math.sin(angle),
            (degreeRatio-.5)*3.2 + Math.sin(i*1.7)*.55
        );
        positions.push(p);
        nodeIndex[node.word]=i;
    });

    // Faint sequential links. Brightness is proportional to P(next | current).
    lineGroup=new THREE.Group();
    data.edges.forEach(edge=>{
        if(nodeIndex[edge.source]===undefined || nodeIndex[edge.target]===undefined)return;
        const geo=new THREE.BufferGeometry().setFromPoints([
            positions[nodeIndex[edge.source]],positions[nodeIndex[edge.target]]
        ]);
        const strength=Math.min(1, edge.probability || 0);
        const material=new THREE.LineBasicMaterial({
            color:strength>.35?0x8f7bff:0x39dff5,
            transparent:true,
            opacity:.08 + strength*.48
        });
        const line=new THREE.Line(geo,material);
        line.userData={source:edge.source,target:edge.target,probability:edge.probability,weight:edge.weight};
        lineGroup.add(line);
    });
    scene.add(lineGroup);

    // Nodes are real tokens. Size = frequency; color = network centrality.
    const nodeMeshes=[];
    nodes.forEach((node,i)=>{
        const freqRatio=node.frequency/maxFreq;
        const degreeRatio=node.degree/maxDegree;
        const size=.075 + freqRatio*.11 + degreeRatio*.055;
        const geometry=new THREE.SphereGeometry(size,18,18);
        const color=degreeRatio>.35?0x9d7cff:0x55e7ff;
        const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95});
        const mesh=new THREE.Mesh(geometry,material);
        mesh.position.copy(positions[i]);
        mesh.userData=node;
        scene.add(mesh);
        nodeMeshes.push(mesh);

        const label=document.createElement("div");
        label.className="node-label";
        label.textContent=node.word;
        label.dataset.word=node.word;
        labelLayer.appendChild(label);
        node.labelElement=label;
    });

    // Ambient particles are decorative; all meaningful nodes/edges come from the NLP model.
    const starsGeo=new THREE.BufferGeometry(), starArr=[];
    for(let i=0;i<450;i++) starArr.push((Math.random()-.5)*32,(Math.random()-.5)*22,(Math.random()-.5)*22);
    starsGeo.setAttribute("position",new THREE.Float32BufferAttribute(starArr,3));
    scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x7894b0,size:.022,transparent:true,opacity:.42})));

    const raycaster=new THREE.Raycaster();
    const pointer=new THREE.Vector2();
    let hovered=null, selected=null;

    function showInspector(node){
        inspector.innerHTML=`
            <div class="inspector-kicker">TOKEN / ${escapeHtml(node.word.toUpperCase())}</div>
            <div class="inspector-word">${escapeHtml(node.word)}</div>
            <div class="inspector-grid">
                <div><small>FREQUENCY</small><b>${node.frequency}</b></div>
                <div><small>P(W)</small><b>${(node.unigram_probability*100).toFixed(2)}%</b></div>
                <div><small>OUTGOING</small><b>${node.degree}</b></div>
                <div><small>P(NEXT|WORD)</small><b>${(node.transition_probability*100).toFixed(1)}%</b></div>
            </div>
            <div class="inspector-next">MOST LIKELY NEXT <strong>${node.best_next ? escapeHtml(node.best_next) : "—"}</strong></div>`;
        inspector.classList.remove("hidden");
    }

    function highlight(node){
        const related=new Set([node.word]);
        data.edges.forEach(e=>{
            if(e.source===node.word)related.add(e.target);
            if(e.target===node.word)related.add(e.source);
        });
        nodeMeshes.forEach(m=>{
            const active=related.has(m.userData.word);
            m.material.opacity=active?1:.13;
            m.scale.setScalar(active?1.35:1);
            m.material.color.setHex(m.userData.word===node.word?0xffffff:(m.userData.degree>0?0x9d7cff:0x55e7ff));
        });
        lineGroup.children.forEach(line=>{
            const active=line.userData.source===node.word || line.userData.target===node.word;
            line.material.opacity=active ? .65 : .035;
        });
        nodes.forEach(n=>n.labelElement.classList.toggle("dim",!related.has(n.word)));
        showInspector(node);
    }

    function updateLabels(){
        const w=container.clientWidth,h=container.clientHeight;
        nodes.forEach((node,i)=>{
            const v=positions[i].clone();
            v.project(camera);
            const x=(v.x*.5+.5)*w;
            const y=(-v.y*.5+.5)*h;
            node.labelElement.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
            const visible=v.z<1;
            node.labelElement.style.opacity=visible ? (node===selected?"1":".72") : "0";
        });
    }

    container.onpointermove=e=>{
        const rect=container.getBoundingClientRect();
        pointer.x=((e.clientX-rect.left)/rect.width)*2-1;
        pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
        raycaster.setFromCamera(pointer,camera);
        const hit=raycaster.intersectObjects(nodeMeshes)[0];
        if(hit && hit.object!==hovered){
            hovered=hit.object;
            highlight(hovered.userData);
            container.style.cursor="pointer";
        }else if(!hit && hovered){
            hovered=null;
            container.style.cursor="grab";
        }
    };
    container.onclick=()=>{
        if(hovered){selected=hovered.userData;highlight(selected);}
    };

    let drag=false,lastX=0,lastY=0;
    container.onpointerdown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;container.style.cursor="grabbing"};
    window.onpointerup=()=>{drag=false;container.style.cursor="grab"};
    window.onpointermove=e=>{
        if(!drag)return;
        scene.rotation.y+=(e.clientX-lastX)*.0045;
        scene.rotation.x+=(e.clientY-lastY)*.0045;
        lastX=e.clientX;lastY=e.clientY;
    };
    container.onwheel=e=>{e.preventDefault();camera.position.z=Math.max(7,Math.min(26,camera.position.z+e.deltaY*.012))};

    const animate=()=>{
        animationId=requestAnimationFrame(animate);
        if(!drag){scene.rotation.y+=.00045;}
        renderer.render(scene,camera);
        updateLabels();
    };
    animate();

    window.onresize=()=>{
        if(!renderer)return;
        camera.aspect=container.clientWidth/container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth,container.clientHeight);
    };
}

async function predict(){
    const phrase=document.getElementById("phrase").value;
    const text=document.getElementById("corpus").value;
    if(!phrase.trim())return;
    try{
        const res=await fetch("/api/predict",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                corpus:text,
                phrase,
                limit:5,
                removePunctuation:document.getElementById("punctuation").checked
            })
        });
        const data=await res.json();
        if(!res.ok)throw new Error(data.error||"Prediction failed");
        const box=document.getElementById("predictions");
        if(!data.predictions.length){
            box.innerHTML=`<div class="glass" style="grid-column:1/-1;color:#8192a8;padding:25px">No matching context was found in this corpus. Try a phrase that appears in your text.</div>`;
            return;
        }
        document.getElementById("predictionContext").textContent =
        "CONTEXT  /  " + phrase.toUpperCase() + "  /  " + (data.predictions[0]?.model || "MODEL");
        box.innerHTML=data.predictions.map((p,i)=>`
            <div class="prediction-card">
                <div class="rank">RANK ${String(i+1).padStart(2,"0")}</div>
                <strong>${escapeHtml(p.word)}</strong>
                <div class="prob">${(p.probability*100).toFixed(2)}%</div>
                <div class="meta">${p.model} MODEL · COUNT ${p.count}</div>
            </div>
        `).join("");
    }catch(e){alert(e.message)}
}

analyze();
