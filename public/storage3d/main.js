import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {exampleBoxes,slots,validateRecord,nextBoxId,normalizeBox,mergeBoxes,LIMITS,COLOR_PRESETS} from './model.js';

const root=document.querySelector('#storageView');
root.innerHTML=`<div class="st-head"><div><h2>3D 器件收纳</h2><div class="st-sub" id="stSummary">1 个收纳盒 · 56 个位置 <span class="st-label">可自定义</span></div></div><div class="st-search-wrap"><input class="st-search" id="stSearch" aria-label="搜索器件或位置" placeholder="搜索器件名称 / 位置编号"></div></div><div class="st-results" id="stResults"></div><div class="st-layout"><aside class="st-list"><div class="st-list-head"><h3>我的收纳盒</h3><button class="st-btn" id="stAddBox" type="button">添加收纳盒</button></div><form id="stBoxForm" class="st-box-form" hidden><label>类型<select id="stBoxType"><option value="tray">长收纳盒</option><option value="tube">正方形试管盒</option></select></label><label>名称<input id="stBoxName" maxlength="40" placeholder="例如 备用长盒"></label><div class="st-box-size"><label>行数<input id="stBoxRows" type="number" min="1" max="12" value="7"></label><label>列数<input id="stBoxCols" type="number" min="1" max="12" value="8"></label></div><p class="st-sub" id="stBoxHint">内部小格 7 × 8，共 56 个位置</p><label>颜色<select id="stBoxColor"></select></label><div class="st-box-form-actions"><button class="st-btn primary" type="submit">保存收纳盒</button><button class="st-btn" id="stBoxCancel" type="button">取消</button></div></form><div id="stBoxes"></div></aside><div class="st-stage"><div class="st-canvas" id="stCanvas"></div><div class="st-tools"><button class="st-btn" id="stAll">全部盒子</button><button class="st-btn" id="stAngle">立体视角</button><button class="st-btn" id="stTop">俯视定位</button><button class="st-btn" id="stLid">合上盒盖</button><button class="st-btn" id="stQuality" aria-pressed="false">流畅模式</button><button class="st-btn" id="stExport">导出模型</button></div><div class="st-hint" id="stHint">拖动旋转 · 滚轮缩放 · 点击小盒选择位置</div></div><aside class="st-editor"><h3>位置与器件</h3><div id="stEmpty" class="st-empty">点击 3D 模型或下方位置表，编辑器件名称。</div><form id="stForm" hidden><div class="st-id" id="stId"></div><div class="st-sub" id="stPosition"></div><label>关联库存器件<select id="stComponent"><option value="">仅命名，不关联库存</option></select></label><label>器件名称<input id="stName" maxlength="80" placeholder="例如 1N5819W"></label><label>备注<textarea id="stNotes" maxlength="500" placeholder="封装、参数或其他说明"></textarea></label><button class="st-btn primary" type="submit">保存此位置</button></form><div class="st-status" id="stStatus" role="status">名称保存在当前浏览器，刷新后仍然保留。</div></aside></div><div class="st-grid-wrap"><div class="st-grid-title"><strong id="stGridTitle"></strong><span class="st-sub">A 行在上方 · 01 列在左侧 · 双击格子改名称</span></div><div id="stGrid" class="st-grid"></div></div>`;
const $=s=>root.querySelector(s);const bridge=window.ComponentStorageBridge;
let boxes=exampleBoxes.map(b=>({...b})), active=boxes[0], selected=null,overview=false,opened=true,signature='',editScope='',editingBoxId='',editingId='',scene,renderer,camera,controls,group,lid,picks=[],slotGroups=new Map();
let records={};let components=[];let pendingFrame=0,lastFrameTime=0;
function invalidate(){if(pendingFrame||!renderer)return;pendingFrame=1;setTimeout(()=>requestAnimationFrame(()=>{pendingFrame=0;if(!root.classList.contains('active')||document.hidden)return;lastFrameTime=performance.now();renderer.render(scene,camera);}),Math.max(0,34-(performance.now()-lastFrameTime)));}
new MutationObserver(invalidate).observe(root,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',invalidate);
function customBoxes(){return boxes.filter(b=>b.custom);}
function updateSummary(){
  const total=boxes.reduce((n,b)=>n+b.rows*b.cols,0);
  const sub=$('#stSummary');
  if(sub) sub.innerHTML=`${boxes.length} 个收纳盒 · ${total} 个位置 <span class="st-label">可自定义</span>`;
  const nav=document.querySelector('#navStorageCount');
  if(nav) nav.textContent=String(boxes.length);
}
function read(){
  const v=bridge.read();
  records=v.records||{};
  components=v.components||[];
  boxes=mergeBoxes(v.boxes, v.layout||'example');
  if(!boxes.some(b=>b.id===active?.id)) active=boxes[0];
  updateSummary();
  return v;
}
function data(id){const record=records[id]||{};const comp=components.find(c=>c.id===record.componentId)||components.find(c=>c.location===id);return {...record,name:comp?.name||record.name||'',componentId:record.componentId||comp?.id||''};}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function renderBoxes(){
  const list=$('#stBoxes');
  list.replaceChildren();
  for(const b of boxes){
    const btn=el('button',undefined,'st-box');
    btn.type='button';
    btn.setAttribute('aria-pressed',String(!overview&&active.id===b.id));
    const dot=el('span',undefined,'st-dot');
    dot.style.background=`#${b.color.toString(16).padStart(6,'0')}`;
    const t=el('span');
    t.append(el('b',b.id+' · '+b.name),el('small',`${slots(b).filter(s=>data(s.id).name).length} / ${b.rows*b.cols} 已命名`));
    btn.append(dot,t);
    if(b.custom){
      const actions=el('span',undefined,'st-box-actions');
      const edit=el('button','设置','st-mini');
      edit.type='button';
      edit.onclick=e=>{e.stopPropagation();openBoxForm(b);};
      const del=el('button','删除','st-mini danger');
      del.type='button';
      del.onclick=e=>{e.stopPropagation();removeBox(b);};
      actions.append(edit,del);
      btn.append(actions);
    }
    btn.onclick=()=>showBox(b);
    list.append(btn);
  }
}
function renderGrid(){
  if(editingId) return;
  const grid=$('#stGrid');
  grid.style.gridTemplateColumns=`repeat(${active.cols}, minmax(0,1fr))`;
  $('#stGridTitle').textContent=`${active.id} · ${active.name} / ${active.rows} × ${active.cols}`;
  grid.replaceChildren();
  for(const s of slots(active)){
    const d=data(s.id);
    const cell=el('div',undefined,`st-cell ${d.name?'occupied':''} ${selected===s.id?'selected':''}`);
    cell.dataset.slotId=s.id;
    cell.tabIndex=0;
    cell.setAttribute('role','button');
    cell.title=`${s.id} ${d.name||'未命名'} · 双击改名称`;
    cell.setAttribute('aria-label',cell.title);
    cell.append(el('b',s.id),el('span',d.name||'未命名'));
    cell.onclick=()=>select(s.id);
    cell.ondblclick=e=>{e.preventDefault();inlineEdit(s.id,cell);};
    cell.onkeydown=e=>{if(e.key==='Enter'||e.key==='F2'){e.preventDefault();inlineEdit(s.id,cell);}};
    grid.append(cell);
  }
}
function inlineEdit(id,cell){
  if(editingId===id) return;
  if(overview) showBox(boxes.find(b=>id.startsWith(b.id+'-')));
  selected=id;
  editingId=id;
  const d=data(id);
  editScope=read().scope;
  cell.classList.add('editing','selected');
  const nameSpan=cell.querySelector('span');
  const input=el('input');
  input.type='text';
  input.className='st-cell-input';
  input.maxLength=80;
  input.value=d.name||'';
  input.setAttribute('aria-label','器件名称');
  nameSpan.replaceWith(input);
  input.focus();
  input.select();
  let done=false;
  const finish=save=>{
    if(done||editingId!==id) return;
    done=true;
    editingId='';
    if(save){
      try{
        const record=validateRecord(id,{name:input.value,notes:d.notes||'',componentId:d.componentId||''},boxes);
        bridge.save(id,record,editScope);
        read();
        $('#stStatus').textContent='已保存到当前浏览器。';
      }catch(error){
        $('#stStatus').textContent=error.message;
      }
    }
    renderBoxes();
    renderGrid();
    build();
    if($('#stForm')&&id===selected){
      const next=data(id);
      $('#stName').value=next.name;
    }
  };
  input.onkeydown=e=>{
    if(e.key==='Enter'){e.preventDefault();e.stopPropagation();finish(true);}
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(false);}
  };
  input.onblur=()=>finish(true);
  input.onclick=e=>e.stopPropagation();
  input.ondblclick=e=>e.stopPropagation();
}
function highlightGrid(id){
  const grid=$('#stGrid');
  if(!grid||!grid.children.length){renderGrid();return;}
  for(const cell of grid.children) cell.classList.toggle('selected',cell.dataset.slotId===id);
}
function select(id){if(overview)showBox(boxes.find(b=>id.startsWith(b.id+'-')));selected=id;const d=data(id);editScope=read().scope;$('#stEmpty').hidden=true;$('#stForm').hidden=false;$('#stId').textContent=id;const s=slots(active).find(s=>s.id===id);$('#stPosition').textContent=`${active.name} · 第 ${s.row+1} 行，第 ${s.col+1} 列 · 序号 ${String(s.index).padStart(2,'0')}`;const opt=$('#stComponent');opt.replaceChildren(new Option('仅命名，不关联库存',''));for(const c of components)opt.add(new Option(`${c.name} · ${c.package||'未填封装'}${c.location?' · '+c.location:''}`,c.id));opt.value=d.componentId||'';$('#stName').value=d.name;$('#stNotes').value=d.notes||'';for(const [key,g]of slotGroups){g.position.y=key===id?.25:0;g.outline.visible=key===id;}highlightGrid(id);invalidate();}
function showBox(b){active=b;overview=false;selected=null;$('#stForm').hidden=true;$('#stEmpty').hidden=false;opened=true;$('#stLid').textContent='合上盒盖';renderBoxes();renderGrid();build();view(false);}
function material(color,opacity=1){return new THREE.MeshStandardMaterial({color,roughness:opacity<1?.24:.35,metalness:0,envMapIntensity:opacity<1?.85:.6,transparent:opacity<1,opacity,depthWrite:opacity===1});}
const plastic=material(0xc4d8e2,.32),rimMat=material(0xc5d7df,.45),white=material(0xf1f6f3),dark=material(0x13212a);
function cuboid(parent,w,h,d,x,y,z,mat,r=.08){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,r),mat);mesh.position.set(x,y,z);mesh.castShadow=mat.opacity>.45;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function wrapCanvasText(ctx,text,maxWidth,maxLines){
  const chars=[...String(text||'')];
  if(!chars.length)return [''];
  const lines=[];
  let current='';
  for(let i=0;i<chars.length;i++){
    const trial=current+chars[i];
    if(current&&ctx.measureText(trial).width>maxWidth){
      lines.push(current);
      current=chars[i];
      if(lines.length>=maxLines-1){
        let rest=chars.slice(i).join('');
        if(ctx.measureText(rest).width>maxWidth){
          while(rest.length>1&&ctx.measureText(rest+'…').width>maxWidth)rest=rest.slice(0,-1);
          rest+='…';
        }
        lines.push(rest);
        return lines;
      }
    }else current=trial;
  }
  if(current)lines.push(current);
  return lines;
}
function roundRectPath(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function labelTexture(code,name){
  const title=String(name||'').trim();
  const text=title||code;
  const c=document.createElement('canvas');
  c.width=512;c.height=512;
  const ctx=c.getContext('2d',{alpha:true});
  ctx.clearRect(0,0,512,512);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillStyle='#eef5f7';
  roundRectPath(ctx,36,150,440,212,36);ctx.fill();
  ctx.fillStyle='#163e52';
  let size=title?96:110;
  ctx.font=`800 ${size}px Arial,"Microsoft YaHei",sans-serif`;
  while(ctx.measureText(text).width>400&&size>44){
    size-=2;
    ctx.font=`800 ${size}px Arial,"Microsoft YaHei",sans-serif`;
  }
  if(ctx.measureText(text).width>400){
    ctx.font='800 52px Arial,"Microsoft YaHei",sans-serif';
    const lines=wrapCanvasText(ctx,text,400,2);
    lines.forEach((line,i)=>ctx.fillText(line,256,232+i*56));
  }else{
    ctx.fillText(text,256,256);
  }
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=renderer?renderer.capabilities.getMaxAnisotropy():1;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=false;
  return tex;
}
function label(parent,code,name,w,d,x,y,z){
  const tex=labelTexture(code,name);
  const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);
  mesh.rotation.x=-Math.PI/2;
  mesh.position.set(x,y,z);
  mesh.renderOrder=2;
  parent.add(mesh);
  return mesh;
}
function shell(parent,w,d,h,color){cuboid(parent,w,.12,d,0,.06,0,material(color,.94));for(const x of [-w/2,w/2])cuboid(parent,.11,h,d,x,h/2,0,plastic);for(const z of [-d/2,d/2])cuboid(parent,w,h,.11,0,h/2,z,plastic);for(const x of [-w/2,w/2])cuboid(parent,.14,.12,d,x,h,0,rimMat);for(const z of [-d/2,d/2])cuboid(parent,w,.12,.14,0,h,z,rimMat);}
function addBox(b,parent,simple=false){const g=new THREE.Group();g.name=b.id;g.userData={boxId:b.id,rows:b.rows,columns:b.cols};parent.add(g);const pitch=b.type==='tray'?1.1:.91,w=b.cols*pitch+.4,d=b.rows*pitch+.4,h=b.type==='tray'?.86:1.85; shell(g,w,d,h,b.type==='tray'?0xbbd2cc:b.color);
  if(simple){
    const geometry=b.type==='tray'?new THREE.BoxGeometry(.99,.65,.99):new THREE.CylinderGeometry(.34,.25,1.6,10);
    const instances=new THREE.InstancedMesh(geometry,material(b.type==='tray'?0xb2c7d0:0xa9c1c7),b.rows*b.cols);
    instances.userData={boxId:b.id,slotIds:slots(b).map(s=>s.id)};instances.name=b.id+'-positions';
    const matrix=new THREE.Matrix4();for(const slot of slots(b))instances.setMatrixAt(slot.index-1,matrix.makeTranslation((slot.col-(b.cols-1)/2)*pitch,b.type==='tray'?.47:.92,(slot.row-(b.rows-1)/2)*pitch));
    instances.instanceMatrix.needsUpdate=true;g.add(instances);picks.push(instances);label(g,b.id,b.name,w*.9,.85,0,h+.45,d/2+1);return g;
  }
  if(b.type==='tube'){// Raised colored rack, drilled with actual tube openings.
    const rack=new THREE.Shape();rack.moveTo(-w/2,-d/2);rack.lineTo(w/2,-d/2);rack.lineTo(w/2,d/2);rack.lineTo(-w/2,d/2);rack.closePath();
    for(const s of slots(b)){const x=(s.col-(b.cols-1)/2)*pitch,z=(s.row-(b.rows-1)/2)*pitch;const hole=new THREE.Path();hole.absarc(x,-z,.34,0,Math.PI*2,true);rack.holes.push(hole);}
    const plate=new THREE.Mesh(new THREE.ExtrudeGeometry(rack,{depth:.12,bevelEnabled:false,curveSegments:12}),material(b.color));plate.rotation.x=-Math.PI/2;plate.position.y=1.22;plate.castShadow=true;plate.receiveShadow=true;g.add(plate);
  }
  for(const s of slots(b)){const sg=new THREE.Group();sg.name=s.id;sg.userData={slotId:s.id,sequence:s.index};sg.position.set((s.col-(b.cols-1)/2)*pitch,0,(s.row-(b.rows-1)/2)*pitch);g.add(sg);const occupied=!!data(s.id).name;let target;
    if(b.type==='tray'){target=cuboid(sg,.99,.65,.99,0,.47,0,plastic,.12);cuboid(sg,1.02,.12,1.02,0,.83,0,rimMat,.12);if(!simple)label(sg,s.id.slice(b.id.length+1),data(s.id).name,.94,.90,0,.912,0);}
    else{const points=[new THREE.Vector2(0,0),new THREE.Vector2(.12,.06),new THREE.Vector2(.25,.28),new THREE.Vector2(.29,.55),new THREE.Vector2(.29,1.53)];target=new THREE.Mesh(new THREE.LatheGeometry(points,simple?12:24),plastic);target.position.y=.12;sg.add(target);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.13,simple?12:24),rimMat);cap.position.y=1.72;cap.castShadow=true;cap.receiveShadow=true;sg.add(cap);cuboid(sg,.15,.06,.2,.31,1.73,0,rimMat,.03);if(!simple)label(sg,s.id.slice(b.id.length+1),data(s.id).name,.66,.66,0,1.802,0);}
    // Every visible part belongs to its slot, especially the closed cap and label.
    sg.traverse(obj=>{if(obj.isMesh||obj.isSprite){obj.userData={...obj.userData,boxId:b.id,slotId:s.id};picks.push(obj);}});
    if(!simple){const ring=b.type==='tube'
      ?new THREE.Mesh(new THREE.TorusGeometry(.385,.026,8,40),new THREE.MeshBasicMaterial({color:0xffce66}))
      :new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04,.04,1.04)),new THREE.LineBasicMaterial({color:0xffce66}));
      if(b.type==='tube')ring.rotation.x=Math.PI/2;ring.position.y=b.type==='tray'?.91:1.82;ring.visible=selected===s.id;sg.add(ring);sg.outline=ring;slotGroups.set(s.id,sg);if(selected===s.id)sg.position.y=.25;}
  }
  const cover=new THREE.Group();cover.position.set(0,h+.13,-d/2);g.add(cover);cuboid(cover,w+.2,.12,d+.2,0,0,d/2,plastic);for(const x of [-w/2,w/2])cuboid(cover,.12,.23,d,x,.04,d/2,rimMat);for(const z of [0,d])cuboid(cover,w,.23,.12,0,.04,z,rimMat);for(const x of [-w*.28,w*.28])cuboid(cover,.65,.3,.14,x,-.1,d+.04,rimMat);if(!simple){lid=cover;cover.rotation.x=opened?-Math.PI*.62:0;}else{cover.visible=false;label(g,b.id,b.name,w*.9,.85,0,h+.45,d/2+1);}
  return g;
}
function disposeGroup(){if(!group)return;const geos=new Set(),mats=new Set();group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geos.add(o.geometry);if(o.material){for(const m of [].concat(o.material))if(![plastic,rimMat,white,dark].includes(m))mats.add(m);}});geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});scene.remove(group);}
function overviewCell(){
  return Math.max(...boxes.map(b=>{
    const pitch=b.type==='tray'?1.1:.91;
    return Math.max(b.cols*pitch,b.rows*pitch)+4;
  }),11);
}
function build(){if(!renderer)return;disposeGroup();group=new THREE.Group();scene.add(group);picks=[];slotGroups=new Map();lid=null;if(overview){const cell=overviewCell();boxes.forEach((b,i)=>{const g=addBox(b,group,true);g.position.set((i%4-1.5)*cell,0,(Math.floor(i/4)-1)*cell);});}else addBox(active,group);renderer.shadowMap.needsUpdate=true;invalidate();}
function view(top){if(!renderer)return;controls.target.set(0,.5,overview?0:0);const scale=overview?Math.max(4,Math.ceil(boxes.length/4)*1.7):1;camera.position.set(top?0:5.5*scale,top?16*scale:15.5*scale,top?.001:7.5*scale);controls.update();}
function init3d(){const host=$('#stCanvas');try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){$('#stHint').textContent='此设备未能启动 3D，可用下方位置表继续命名和查找。';return;}renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=false;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);scene=new THREE.Scene();scene.background=new THREE.Color(0x172a3b);scene.fog=new THREE.Fog(0x172a3b,48,115);
const pmrem=new THREE.PMREMGenerator(renderer),studio=new RoomEnvironment();scene.environment=pmrem.fromScene(studio,.06).texture;scene.environmentIntensity=.45;studio.dispose();pmrem.dispose();camera=new THREE.PerspectiveCamera(38,1,.1,250);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.addEventListener('change',invalidate);controls.maxPolarAngle=Math.PI*.48;controls.minDistance=5;controls.maxDistance=95;scene.add(new THREE.HemisphereLight(0xb7d6f5,0x19252f,.8));
const sun=new THREE.DirectionalLight(0xfff0d6,2.8);sun.position.set(-7,13,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:.5,far:55});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;sun.shadow.radius=4;scene.add(sun);
const rim=new THREE.DirectionalLight(0x87bbff,1.8);rim.position.set(8,8,-8);scene.add(rim);
const fill=new THREE.DirectionalLight(0xd9f7ff,.8);fill.position.set(-8,4,-2);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(220,220),new THREE.MeshStandardMaterial({color:0x0d1b29,roughness:.64,metalness:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-.16;floor.receiveShadow=true;scene.add(floor);const observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();invalidate();}});observer.observe(host);let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);scene.updateMatrixWorld(true);const hit=ray.intersectObjects(picks)[0];if(hit){const {boxId,slotId}=hit.object.userData;if(overview)showBox(boxes.find(b=>b.id===boxId));else select(slotId);}});renderer.domElement.style.cursor='grab';build();view(false);}
$('#stAll').onclick=()=>{overview=true;selected=null;$('#stForm').hidden=true;$('#stEmpty').hidden=false;renderBoxes();build();view(false);$('#stHint').textContent=`${boxes.length} 个盒子全览 · 点击盒内任意位置进入该盒`;};
$('#stAngle').onclick=()=>view(false);$('#stTop').onclick=()=>view(true);$('#stLid').onclick=()=>{if(overview)return;opened=!opened;if(lid)lid.rotation.x=opened?-Math.PI*.62:0;$('#stLid').textContent=opened?'合上盒盖':'打开盒盖';renderer.shadowMap.needsUpdate=true;invalidate();};
$('#stQuality').onclick=()=>{const quality=!renderer.shadowMap.enabled;renderer.shadowMap.enabled=quality;renderer.shadowMap.needsUpdate=true;renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality?2:1.75));const host=$('#stCanvas');if(host.clientWidth&&host.clientHeight)renderer.setSize(host.clientWidth,host.clientHeight,false);scene.traverse(o=>{if(o.material)for(const m of [].concat(o.material))m.needsUpdate=true;});$('#stQuality').textContent=quality?'光影模式':'流畅模式';$('#stQuality').setAttribute('aria-pressed',String(quality));invalidate();};
$('#stComponent').onchange=()=>{const c=components.find(c=>c.id===$('#stComponent').value);if(c)$('#stName').value=c.name;};
$('#stForm').onsubmit=e=>{e.preventDefault();try{const record=validateRecord(selected,{name:$('#stName').value,notes:$('#stNotes').value,componentId:$('#stComponent').value},boxes);bridge.save(selected,record,editScope);read();build();select(selected);renderBoxes();$('#stStatus').textContent='已保存到当前浏览器。';}catch(error){$('#stStatus').textContent=error.message;}};
$('#stSearch').oninput=()=>{read();const q=$('#stSearch').value.trim().toLowerCase(),results=$('#stResults');results.replaceChildren();if(!q)return;let count=0;for(const b of boxes)for(const s of slots(b)){const d=data(s.id);if(`${s.id} ${d.name}`.toLowerCase().includes(q)){count++;if(count<=30){const btn=el('button',`${s.id} · ${d.name||'未命名'}`,'st-btn');btn.onclick=()=>{showBox(b);select(s.id);view(true);};results.append(btn);}}}if(!count)results.append(el('span','没有匹配的位置或器件','st-sub'));if(count>30)results.append(el('span',`共 ${count} 个结果，显示前 30 个，请缩小搜索范围`,'st-sub'));};
$('#stExport').onclick=async()=>{if(!group)return;$('#stStatus').textContent='正在导出 3D 模型…';try{const result=await new GLTFExporter().parseAsync(group,{binary:true});const url=URL.createObjectURL(new Blob([result],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download=`${overview?'all-boxes':active.id}.glb`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);$('#stStatus').textContent='模型已导出。名称编辑和本地保存由网站模块提供。';}catch(e){$('#stStatus').textContent='导出失败：'+e.message;}};
function fillColorOptions(type,selected){
  const sel=$('#stBoxColor');
  sel.replaceChildren();
  for(const p of COLOR_PRESETS[type==='tube'?'tube':'tray']){
    const opt=new Option(p.label,String(p.value));
    if(Number(selected)===p.value) opt.selected=true;
    sel.add(opt);
  }
}
function updateBoxHint(){
  const type=$('#stBoxType').value==='tube'?'tube':'tray';
  const limit=LIMITS[type];
  const rows=Math.min(limit.maxRows,Math.max(limit.minRows,Number($('#stBoxRows').value)||limit.minRows));
  const cols=Math.min(limit.maxCols,Math.max(limit.minCols,Number($('#stBoxCols').value)||limit.minCols));
  $('#stBoxRows').min=limit.minRows;$('#stBoxRows').max=limit.maxRows;
  $('#stBoxCols').min=limit.minCols;$('#stBoxCols').max=limit.maxCols;
  $('#stBoxHint').textContent=type==='tube'
    ? `试管 ${rows} × ${cols}，共 ${rows*cols} 个位置（最多 ${limit.maxRows}×${limit.maxCols}）`
    : `内部小格 ${rows} × ${cols}，共 ${rows*cols} 个位置（最多 ${limit.maxRows}×${limit.maxCols}）`;
}
function openBoxForm(box){
  editingBoxId=box?.id||'';
  const type=box?.type||'tray';
  $('#stBoxForm').hidden=false;
  $('#stBoxType').value=type;
  $('#stBoxType').disabled=!!box;
  $('#stBoxName').value=box?.name||'';
  $('#stBoxRows').value=box?.rows||(type==='tube'?9:7);
  $('#stBoxCols').value=box?.cols||(type==='tube'?9:8);
  fillColorOptions(type,box?.color);
  updateBoxHint();
  $('#stBoxName').focus();
}
function closeBoxForm(){
  editingBoxId='';
  $('#stBoxForm').hidden=true;
  $('#stBoxType').disabled=false;
}
function persistCustom(list){
  editScope=read().scope;
  bridge.saveBoxes(list,editScope);
  read();
  renderBoxes();
  renderGrid();
  build();
  updateSummary();
}
function removeBox(box){
  if(!box.custom) return;
  if(!confirm(`删除 ${box.id} · ${box.name}？该盒内的命名也会一起删除。`)) return;
  persistCustom(customBoxes().filter(b=>b.id!==box.id));
  if(active.id===box.id){active=boxes[0];overview=false;showBox(active);}
  $('#stStatus').textContent=`已删除 ${box.id}。`;
}
$('#stAddBox').onclick=()=>openBoxForm();
$('#stBoxCancel').onclick=closeBoxForm;
$('#stBoxType').onchange=()=>{
  const type=$('#stBoxType').value;
  $('#stBoxRows').value=type==='tube'?9:7;
  $('#stBoxCols').value=type==='tube'?9:8;
  fillColorOptions(type);
  updateBoxHint();
};
$('#stBoxRows').oninput=updateBoxHint;
$('#stBoxCols').oninput=updateBoxHint;
$('#stBoxForm').onsubmit=e=>{
  e.preventDefault();
  try{
    const type=$('#stBoxType').value==='tube'?'tube':'tray';
    const current=customBoxes();
    const wasEdit=!!editingBoxId;
    if(!wasEdit && current.length>=LIMITS.maxCustom) throw Error(`最多再添加 ${LIMITS.maxCustom} 个自定义收纳盒`);
    const spec=normalizeBox({
      id:editingBoxId||nextBoxId(boxes,type),
      name:$('#stBoxName').value,
      type,
      rows:$('#stBoxRows').value,
      cols:$('#stBoxCols').value,
      color:Number($('#stBoxColor').value),
      custom:true
    },boxes.filter(b=>b.id!==editingBoxId),boxes.filter(b=>!b.custom));
    const next=wasEdit
      ? current.map(b=>b.id===spec.id?spec:b)
      : [...current,spec];
    persistCustom(next);
    closeBoxForm();
    showBox(boxes.find(b=>b.id===spec.id)||spec);
    $('#stStatus').textContent=wasEdit?`已更新 ${spec.id}。`:`已添加 ${spec.id} · ${spec.name}。`;
  }catch(error){$('#stStatus').textContent=error.message;}
};
function refresh(){if(editingId)return;const v=read(),sig=JSON.stringify([v.scope,records,v.boxes,components.map(c=>[c.id,c.name,c.location])]);if(sig===signature)return;signature=sig;if(editScope&&v.scope!==editScope){selected=null;$('#stForm').hidden=true;$('#stEmpty').hidden=false;$('#stStatus').textContent='已切换仓库，请重新选择位置。';}renderBoxes();renderGrid();build();}
read();signature=JSON.stringify([bridge.read().scope,records,bridge.read().boxes,components.map(c=>[c.id,c.name,c.location])]);renderBoxes();renderGrid();init3d();setInterval(()=>{if(root.classList.contains('active')&&!document.hidden)refresh();},5000);
