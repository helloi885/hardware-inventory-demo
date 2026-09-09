export const defaultBoxes = [
  ...Array.from({length:8}, (_,i)=>({id:`L${String(i+1).padStart(2,'0')}`,name:`长盒 ${i+1}`,rows:7,cols:8,type:'tray',color:0x8caeb6,custom:false})),
  {id:'IC01',name:'芯片试管盒',rows:9,cols:9,type:'tube',color:0xe2bd14,custom:false},
  {id:'C01',name:'电容试管盒',rows:9,cols:9,type:'tube',color:0x149865,custom:false},
  {id:'R01',name:'电阻试管盒',rows:9,cols:9,type:'tube',color:0x168760,custom:false}
];
export const exampleBoxes = [
  {id:'L01',name:'示例长盒',rows:7,cols:8,type:'tray',color:0x8caeb6,custom:false}
];
export const boxes = exampleBoxes;

export function baseBoxesFor(layout){
  return layout==='full'?defaultBoxes:exampleBoxes;
}

export const LIMITS = {
  tray: {minRows:1,maxRows:12,minCols:1,maxCols:12},
  tube: {minRows:1,maxRows:10,minCols:1,maxCols:10},
  maxCustom: 20
};

export const COLOR_PRESETS = {
  tray: [
    {label:'灰蓝',value:0x8caeb6},
    {label:'浅青',value:0x6aa8b8},
    {label:'灰绿',value:0x8fb39a}
  ],
  tube: [
    {label:'黄',value:0xe2bd14},
    {label:'绿',value:0x149865},
    {label:'深青',value:0x168760},
    {label:'橙',value:0xd98a3a}
  ]
};

export function slots(box){
  const rows=Math.max(1,Number(box.rows)||1);
  const cols=Math.max(1,Number(box.cols)||1);
  return Array.from({length:rows*cols},(_,i)=>({
    id:`${box.id}-${String.fromCharCode(65+Math.floor(i/cols))}${String(i%cols+1).padStart(2,'0')}`,
    row:Math.floor(i/cols),
    col:i%cols,
    index:i+1
  }));
}

export function nextBoxId(list,type){
  const prefix=type==='tube'?'T':'L';
  const used=new Set((list||[]).map(b=>b.id));
  for(let n=1;n<=99;n++){
    const id=`${prefix}${String(n).padStart(2,'0')}`;
    if(!used.has(id)) return id;
  }
  throw Error('收纳盒数量已达上限');
}

function clampInt(value,min,max,fallback){
  const n=Number.parseInt(value,10);
  if(!Number.isFinite(n)) return fallback;
  return Math.min(max,Math.max(min,n));
}

export function normalizeBox(raw,existing=[],base=exampleBoxes){
  const type=raw?.type==='tube'?'tube':'tray';
  const limit=LIMITS[type];
  const rows=clampInt(raw?.rows,limit.minRows,limit.maxRows,type==='tube'?9:7);
  const cols=clampInt(raw?.cols,limit.minCols,limit.maxCols,type==='tube'?9:8);
  const name=String(raw?.name||'').trim().slice(0,40) || (type==='tube'?'试管盒':'长盒');
  const presets=COLOR_PRESETS[type];
  const color=presets.some(p=>p.value===Number(raw?.color))?Number(raw.color):presets[0].value;
  let id=String(raw?.id||'').trim().toUpperCase();
  if(!/^[A-Z]{1,3}\d{2}$/.test(id)) id=nextBoxId(existing,type);
  if(base.some(b=>b.id===id) && raw?.custom) throw Error('不能占用原有收纳盒编号');
  return {id,name,rows,cols,type,color,custom:true};
}

export function sanitizeCustomBoxes(list,base=exampleBoxes){
  if(!Array.isArray(list)) return [];
  const out=[];
  const used=new Set(base.map(b=>b.id));
  for(const raw of list){
    try{
      const box=normalizeBox(raw,[...base,...out],base);
      if(used.has(box.id)) continue;
      used.add(box.id);
      out.push(box);
      if(out.length>=LIMITS.maxCustom) break;
    }catch{}
  }
  return out;
}

export function mergeBoxes(custom,layout='example'){
  const base=baseBoxesFor(layout);
  return [...base.map(b=>({...b})),...sanitizeCustomBoxes(custom,base)];
}

export function validateRecord(id,record,boxList=exampleBoxes){
  const valid=new Set((boxList||defaultBoxes).flatMap(b=>slots(b).map(s=>s.id)));
  if(!valid.has(id)) throw Error('无效的位置编号');
  if(typeof record.name!=='string'||record.name.length>80) throw Error('器件名称最多 80 字');
  if(typeof record.notes!=='string'||record.notes.length>500) throw Error('备注最多 500 字');
  return {name:record.name.trim(),notes:record.notes.trim(),componentId:String(record.componentId||'')};
}

export const validIds = new Set(defaultBoxes.flatMap(b=>slots(b).map(s=>s.id)));
