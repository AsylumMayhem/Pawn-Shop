const {createElement:h,useState,useEffect,useMemo,useCallback}=React;
const UNITS=['pcs','g','oz','mm','ct','in','cm','ft','lb','kg','ml','l'];
const fmt=n=>'$'+(parseFloat(n)||0).toFixed(2);
const fq=n=>{const v=parseFloat(n)||0;return v===Math.floor(v)?String(v):v.toFixed(2);};
const uid=()=>'x'+Date.now()+Math.random().toString(36).slice(2,6);
const gemCls=name=>{const n=(name||'').toLowerCase();if(n.includes('sapphire'))return'g-s';if(n.includes('ruby'))return'g-r';if(n.includes('emerald'))return'g-e';if(n.includes('aquamarine'))return'g-a';if(n.includes('citrine'))return'g-c';if(n.includes('onyx'))return'g-o';if(n.includes('gold'))return'g-g';if(n.includes('silver'))return'g-sv';return'g-x';};
const SALES_KEY='ring-crafting-sales-v1',DB_KEY='ring-crafting-db-v1';

function bC(p){return[
  {id:p+'1',name:'Ring Base',qty:1,unit:'pcs',cost:0,siId:null,ringId:'3'},
  {id:p+'2',name:'Celestial Alloy',qty:1,unit:'pcs',cost:0,siId:'si2',ringId:null},
  {id:p+'3',name:'Silver Powder',qty:8,unit:'g',cost:0,siId:'si1',ringId:null}
];}

const DEFAULT_DB={
  si:[
    {id:'si1',name:'Silver Powder',oQty:5,oUnit:'g',inputs:[{id:'i1',name:'Silver Ingot',qty:3,unit:'pcs',cost:35}]},
    {id:'si2',name:'Celestial Alloy',oQty:1,oUnit:'pcs',inputs:[
      {id:'ca1',name:'Celestial Core',qty:3,unit:'pcs',cost:200},
      {id:'ca2',name:'Sapphire',qty:5,unit:'pcs',cost:285},
      {id:'ca3',name:'Onyx',qty:5,unit:'pcs',cost:200},
      {id:'ca4',name:'Aquamarine',qty:5,unit:'pcs',cost:50},
      {id:'ca5',name:'Diamond',qty:5,unit:'pcs',cost:235},
      {id:'ca6',name:'Ruby',qty:5,unit:'pcs',cost:300},
      {id:'ca7',name:'Emerald',qty:5,unit:'pcs',cost:200},
      {id:'ca8',name:'Citrine',qty:5,unit:'pcs',cost:50},
      {id:'ca9',name:'Metal Scrap',qty:10,unit:'pcs',cost:75}
    ]}
  ],
  rings:[
    {id:'1',name:'Ring Wax Mold',desc:'',labor:0,salePrice:0,comps:[
      {id:'c1',name:'Steel',qty:5,unit:'pcs',cost:125,siId:null,ringId:null},
      {id:'c2',name:'Bee Wax',qty:20,unit:'pcs',cost:85,siId:null,ringId:null},
      {id:'c3',name:'Ceramics',qty:5,unit:'pcs',cost:25,siId:null,ringId:null}
    ]},
    {id:'2',name:'Ring Plaster',desc:'',labor:0,salePrice:0,comps:[
      {id:'p1',name:'Aluminum',qty:8,unit:'pcs',cost:90,siId:null,ringId:null},
      {id:'p2',name:'Silver Powder',qty:15,unit:'g',cost:0,siId:'si1',ringId:null},
      {id:'p3',name:'Ceramics',qty:3,unit:'pcs',cost:25,siId:null,ringId:null},
      {id:'p4',name:'Water Bottle',qty:2,unit:'pcs',cost:2,siId:null,ringId:null},
      {id:'p5',name:'Sand',qty:10,unit:'pcs',cost:5,siId:null,ringId:null}
    ]},
    {id:'3',name:'Ring Base',desc:'',labor:0,salePrice:0,comps:[
      {id:'rb1',name:'Ring Wax Mold',qty:1,unit:'pcs',cost:0,siId:null,ringId:'1'},
      {id:'rb2',name:'Ring Plaster',qty:1,unit:'pcs',cost:0,siId:null,ringId:'2'},
      {id:'rb3',name:'Gold Bar',qty:3,unit:'pcs',cost:335,siId:null,ringId:null},
      {id:'rb4',name:'Copper',qty:25,unit:'pcs',cost:20,siId:null,ringId:null}
    ]},
    {id:'4',name:'Sapphire Ring',desc:'',labor:0,salePrice:30000,comps:[...bC('sr'),{id:'sr4',name:'Sapphire',qty:30,unit:'pcs',cost:285,siId:null,ringId:null}]},
    {id:'5',name:'Aquamarine Ring',desc:'',labor:0,salePrice:22500,comps:[...bC('ar'),{id:'ar4',name:'Aquamarine',qty:15,unit:'pcs',cost:50,siId:null,ringId:null}]},
    {id:'6',name:'Emerald Ring',desc:'',labor:0,salePrice:30000,comps:[...bC('er'),{id:'er4',name:'Emerald',qty:30,unit:'pcs',cost:200,siId:null,ringId:null}]},
    {id:'7',name:'Ruby Ring',desc:'',labor:0,salePrice:30000,comps:[...bC('rr'),{id:'rr4',name:'Ruby',qty:25,unit:'pcs',cost:300,siId:null,ringId:null}]},
    {id:'8',name:'Citrine Ring',desc:'',labor:0,salePrice:22500,comps:[...bC('cr'),{id:'cr4',name:'Citrine',qty:15,unit:'pcs',cost:50,siId:null,ringId:null}]},
    {id:'9',name:'Onyx Ring',desc:'',labor:0,salePrice:22500,comps:[...bC('or'),{id:'or4',name:'Onyx',qty:15,unit:'pcs',cost:200,siId:null,ringId:null}]}
  ]
};

// ── cost engine ─────────────────────────────────────────────────────────
function siCPU(si){
  var t=si.inputs.reduce(function(s,i){return s+(+i.qty||0)*(+i.cost||0);},0);
  return t/(+si.oQty||1);
}
function compCost(c,sm,rm){
  if(c.ringId&&rm[c.ringId])return ringCost(rm[c.ringId],sm,rm);
  if(c.siId&&sm[c.siId])return siCPU(sm[c.siId]);
  return +c.cost||0;
}
function ringCost(ring,sm,rm){
  if(!ring)return 0;
  return ring.comps.reduce(function(s,c){return s+(+c.qty||0)*compCost(c,sm,rm);},0)+(+ring.labor||0);
}
function makeMaps(db){
  return {
    sm:Object.fromEntries(db.si.map(function(s){return[s.id,s];})),
    rm:Object.fromEntries(db.rings.map(function(r){return[r.id,r];}))
  };
}
function buildCraftingList(ring,sm,rm){
  var crafted={},raw={};
  function addC(name,qty,unit,uc,type){var k=name+'||'+unit;if(!crafted[k])crafted[k]={name:name,qty:0,unit:unit,unitCost:uc,type:type};crafted[k].qty+=qty;}
  function addR(name,qty,unit,uc){var k=name+'||'+unit;if(!raw[k])raw[k]={name:name,qty:0,unit:unit,unitCost:uc};raw[k].qty+=qty;}
  function walk(r,mul){
    r.comps.forEach(function(c){
      var qty=(+c.qty||0)*mul;
      if(c.ringId&&rm[c.ringId]){addC(rm[c.ringId].name,qty,'pcs',ringCost(rm[c.ringId],sm,rm),'ring');walk(rm[c.ringId],qty);}
      else if(c.siId&&sm[c.siId]){var si=sm[c.siId];addC(si.name,qty,si.oUnit,siCPU(si),'si');var crafts=qty/(+si.oQty||1);si.inputs.forEach(function(inp){addR(inp.name,(+inp.qty||0)*crafts,inp.unit,+inp.cost||0);});}
      else{addR(c.name,qty,c.unit,+c.cost||0);}
    });
  }
  walk(ring,1);
  var cArr=Object.values(crafted).map(function(x){return Object.assign({},x,{total:x.qty*x.unitCost});}).sort(function(a,b){return b.total-a.total;});
  var rArr=Object.values(raw).map(function(x){return Object.assign({},x,{total:x.qty*x.unitCost});}).sort(function(a,b){return b.total-a.total;});
  return {crafted:cArr,raw:rArr};
}
function getAllMats(ring,sm,rm){
  var list=buildCraftingList(ring,sm,rm);
  return list.crafted.concat(list.raw.map(function(x){return Object.assign({},x,{type:'raw'});})).sort(function(a,b){return b.total-a.total;});
}
function loadDB(){try{var r=localStorage.getItem(DB_KEY);return r?JSON.parse(r):DEFAULT_DB;}catch(e){return DEFAULT_DB;}}
function saveDB(db){try{localStorage.setItem(DB_KEY,JSON.stringify(db));}catch(e){}}
function loadSales(){try{var r=localStorage.getItem(SALES_KEY);return r?JSON.parse(r):{orders:[],globalSupplied:[]};}catch(e){return {orders:[],globalSupplied:[]};}}
function saveSales(s){try{localStorage.setItem(SALES_KEY,JSON.stringify(s));}catch(e){}}

// ── shared UI ────────────────────────────────────────────────────────────
function GemDot(props){return h('div',{className:'gdot '+gemCls(props.name),style:props.style});}
function UnitSel(props){return h('select',{value:props.value,onChange:props.onChange,style:props.style},UNITS.map(function(u){return h('option',{key:u},u);}));}
function FG(props){return h('div',{className:'fg',style:props.style},h('label',null,props.label),props.children);}

// ── Secondary Ingredient Card ────────────────────────────────────────────
function SICard(props){
  var si=props.si,onUpdate=props.onUpdate,onDelete=props.onDelete;
  var open=useState(false),setOpen=open[1]; open=open[0];
  var editing=useState(false),setEditing=editing[1]; editing=editing[0];
  var cpu=siCPU(si);
  var tot=si.inputs.reduce(function(s,i){return s+(+i.qty||0)*(+i.cost||0);},0);
  return h('div',{className:'card'},
    h('div',{className:'card-h',onClick:function(){setOpen(function(o){return !o;});}},
      h('span',{className:'chev '+(open?'open':'')},'▶'),
      h(GemDot,{name:si.name}),
      h('div',{style:{flex:1}},
        h('div',{className:'ct'},si.name),
        h('div',{className:'cs'},si.inputs.length+' inputs → '+si.oQty+' '+si.oUnit+' yield')
      ),
      h('span',{className:'pill p-blue',style:{marginRight:6}},fmt(cpu)+' / '+si.oUnit)
    ),
    open&&h('div',{className:'card-b'},
      h('div',{style:{display:'flex',gap:6,paddingTop:10,flexWrap:'wrap',alignItems:'center'}},
        h('button',{className:'btn btn-ghost btn-sm',onClick:function(){setEditing(function(e){return !e;});}},editing?'Done':'Edit Costs'),
        h('span',{style:{fontSize:11,color:'var(--txm)',marginLeft:6}},editing?'Output qty:':'Output:'),
        editing
          ?h('input',{type:'number',min:1,step:'any',value:si.oQty,onChange:function(e){onUpdate(Object.assign({},si,{oQty:parseFloat(e.target.value)||1}));},style:{width:50,fontSize:13,marginLeft:4}})
          :h('strong',{style:{fontSize:13,marginLeft:4}},si.oQty+' '+si.oUnit),
        h('button',{className:'btn btn-danger btn-sm',style:{marginLeft:'auto'},onClick:function(){if(confirm('Delete?'))onDelete(si.id);}},'✕ Delete')
      ),
      h('table',{className:'tbl'},
        h('thead',null,h('tr',null,h('th',null,'Input'),h('th',{className:'r'},'Qty'),h('th',{className:'r'},'Unit'),h('th',{className:'r'},'Unit Cost'),h('th',{className:'r'},'Subtotal'),h('th',null,''))),
        h('tbody',null,
          si.inputs.map(function(inp){
            return h('tr',{key:inp.id},
              h('td',null,inp.name),h('td',{className:'r'},fq(inp.qty)),h('td',{className:'r'},inp.unit),
              h('td',{className:'r'},editing
                ?h('input',{type:'number',min:0,step:'any',value:inp.cost,style:{width:70,fontSize:12,textAlign:'right'},onChange:function(e){
                    var v=parseFloat(e.target.value)||0;
                    onUpdate(Object.assign({},si,{inputs:si.inputs.map(function(i){return i.id===inp.id?Object.assign({},i,{cost:v}):i;})}));
                  }})
                :fmt(inp.cost)),
              h('td',{className:'r'},fmt((+inp.qty||0)*(+inp.cost||0))),
              h('td',null,h('button',{className:'ib d',onClick:function(){onUpdate(Object.assign({},si,{inputs:si.inputs.filter(function(i){return i.id!==inp.id;})}));}},'\u2715'))
            );
          }),
          h('tr',{className:'ttr'},h('td',{colSpan:4,style:{paddingLeft:8}},'Total input cost'),h('td',{className:'r'},fmt(tot)),h('td',null)),
          h('tr',{className:'tgr'},h('td',{colSpan:4,style:{paddingLeft:8}},'Yields ',h('strong',null,si.oQty+' '+si.oUnit),' · cost per '+si.oUnit),h('td',{className:'r'},fmt(cpu)),h('td',null))
        )
      ),
      h('button',{className:'btn btn-ghost btn-sm',style:{marginTop:9},onClick:function(){
        var name=prompt('Material name:');if(!name)return;
        var qty=parseFloat(prompt('Qty:')||'0');
        var unit=prompt('Unit:')||'pcs';
        var cost=parseFloat(prompt('Unit cost ($):')||'0');
        onUpdate(Object.assign({},si,{inputs:si.inputs.concat([{id:uid(),name:name,qty:qty,unit:unit,cost:cost}])}));
      }},'+ Add Input')
    )
  );
}

// ── Add Component Panel ──────────────────────────────────────────────────
function AddCompPanel(props){
  var tab=props.tab,onTabChange=props.onTabChange,db=props.db,maps=props.maps,currentRingId=props.currentRingId,onAdd=props.onAdd,onCancel=props.onCancel;
  var sm=maps.sm,rm=maps.rm;
  var nameS=useState(''),setName=nameS[1]; nameS=nameS[0];
  var qtyS=useState('1'),setQty=qtyS[1]; qtyS=qtyS[0];
  var unitS=useState('pcs'),setUnit=unitS[1]; unitS=unitS[0];
  var costS=useState(''),setCost=costS[1]; costS=costS[0];
  var eligible=db.rings.filter(function(r){return r.id!==currentRingId&&r.comps.length>0;});
  var siIdS=useState(db.si.length?db.si[0].id:''),setSiId=siIdS[1]; siIdS=siIdS[0];
  var ringIdS=useState(eligible.length?eligible[0].id:''),setRingId=ringIdS[1]; ringIdS=ringIdS[0];

  function add(){
    var q=parseFloat(qtyS)||0;if(!q)return;
    if(tab==='ring'){var r=db.rings.find(function(x){return x.id===ringIdS;});if(!r)return;onAdd({name:r.name,qty:q,unit:'pcs',cost:0,siId:null,ringId:ringIdS});}
    else if(tab==='si'){var s=db.si.find(function(x){return x.id===siIdS;});if(!s)return;onAdd({name:s.name,qty:q,unit:s.oUnit,cost:0,siId:siIdS,ringId:null});}
    else{var n=nameS.trim();if(!n)return;onAdd({name:n,qty:q,unit:unitS,cost:parseFloat(costS)||0,siId:null,ringId:null});}
  }
  return h('div',{className:'fp',style:{marginTop:8}},
    h('div',{className:'fp-t'},'Add Component'),
    h('div',{className:'tabs2'},
      h('button',{className:'t2'+(tab==='raw'?' on':''),onClick:function(){onTabChange('raw');}},'Raw Material'),
      db.si.length>0&&h('button',{className:'t2'+(tab==='si'?' on':''),onClick:function(){onTabChange('si');}},'Secondary'),
      eligible.length>0&&h('button',{className:'t2'+(tab==='ring'?' on':''),onClick:function(){onTabChange('ring');}},'Prerequisite')
    ),
    tab==='ring'&&h('div',{className:'fr'},
      h(FG,{label:'Prerequisite Ring',style:{flex:'2 1 160px'}},h('select',{value:ringIdS,onChange:function(e){setRingId(e.target.value);},style:{width:'100%'}},eligible.map(function(r){return h('option',{key:r.id,value:r.id},r.name+' \u2014 '+fmt(ringCost(r,sm,rm)));}))),
      h(FG,{label:'Qty',style:{flex:'1 1 65px'}},h('input',{type:'number',min:0,step:'any',value:qtyS,onChange:function(e){setQty(e.target.value);}}))
    ),
    tab==='si'&&h('div',{className:'fr'},
      h(FG,{label:'Ingredient',style:{flex:'2 1 160px'}},h('select',{value:siIdS,onChange:function(e){setSiId(e.target.value);},style:{width:'100%'}},db.si.map(function(s){return h('option',{key:s.id,value:s.id},s.name+' \u2014 '+fmt(siCPU(s))+'/'+s.oUnit);}))),
      h(FG,{label:'Qty',style:{flex:'1 1 65px'}},h('input',{type:'number',min:0,step:'any',value:qtyS,onChange:function(e){setQty(e.target.value);}})),
      h(FG,{label:'Unit',style:{flex:'1 1 65px'}},h(UnitSel,{value:unitS,onChange:function(e){setUnit(e.target.value);}}))
    ),
    tab==='raw'&&h('div',{className:'fr'},
      h(FG,{label:'Name',style:{flex:'2 1 130px'}},h('input',{value:nameS,onChange:function(e){setName(e.target.value);},placeholder:'e.g. Gold Bar'})),
      h(FG,{label:'Qty',style:{flex:'1 1 65px'}},h('input',{type:'number',min:0,step:'any',value:qtyS,onChange:function(e){setQty(e.target.value);}})),
      h(FG,{label:'Unit',style:{flex:'1 1 60px'}},h(UnitSel,{value:unitS,onChange:function(e){setUnit(e.target.value);}})),
      h(FG,{label:'Unit Cost ($)',style:{flex:'1 1 80px'}},h('input',{type:'number',min:0,step:'any',value:costS,onChange:function(e){setCost(e.target.value);},placeholder:'0.00'}))
    ),
    h('div',{className:'fa'},
      h('button',{className:'btn btn-gold btn-sm',onClick:add},'+ Add'),
      h('button',{className:'btn btn-ghost btn-sm',onClick:onCancel},'Cancel')
    )
  );
}

// ── Ring Card ────────────────────────────────────────────────────────────
function RingCard(props){
  var ring=props.ring,db=props.db,onUpdate=props.onUpdate,onDelete=props.onDelete,onViewRecipe=props.onViewRecipe,maps=props.maps;
  var sm=maps.sm,rm=maps.rm;
  var openS=useState(['4','5','6','7','8','9'].indexOf(ring.id)>=0),setOpen=openS[1]; openS=openS[0];
  var editingS=useState(false),setEditing=editingS[1]; editingS=editingS[0];
  var addingS=useState(null),setAdding=addingS[1]; addingS=addingS[0];
  var editCIdS=useState(null),setEditCId=editCIdS[1]; editCIdS=editCIdS[0];
  var ernS=useState({name:ring.name,desc:ring.desc||'',labor:ring.labor||0,salePrice:ring.salePrice||0});
  var setErn=ernS[1]; var ern=ernS[0];

  var total=ringCost(ring,sm,rm);
  var mats=ring.comps.reduce(function(s,c){return s+(+c.qty||0)*compCost(c,sm,rm);},0);

  function saveEdit(){
    onUpdate(Object.assign({},ring,{name:ern.name,desc:ern.desc,labor:parseFloat(ern.labor)||0,salePrice:parseFloat(ern.salePrice)||0}));
    setEditing(false);
  }

  return h('div',{className:'card'},
    h('div',{className:'card-h',onClick:function(){setOpen(function(o){return !o;});}},
      h('span',{className:'chev '+(openS?'open':'')},'▶'),
      h(GemDot,{name:ring.name}),
      h('div',{style:{flex:1}},
        h('div',{className:'ct'},ring.name,ring.salePrice>0&&h('span',{className:'p-grn',style:{marginLeft:7}},fmt(ring.salePrice))),
        ring.desc&&h('div',{className:'cs'},ring.desc)
      ),
      h('span',{className:'pill p-cnt',style:{marginRight:6}},ring.comps.length+' comps'),
      h('span',{className:'pill p-gold'},fmt(total))
    ),
    openS&&h('div',{className:'card-b'},
      !editingS
        ?h('div',{style:{display:'flex',gap:6,paddingTop:10,flexWrap:'wrap',alignItems:'center'}},
            ring.comps.length>0&&h('button',{className:'btn btn-ghost btn-sm',onClick:function(){onViewRecipe(ring.id);}},'◇ Full Recipe'),
            h('button',{className:'btn btn-ghost btn-sm',onClick:function(){setErn({name:ring.name,desc:ring.desc||'',labor:ring.labor||0,salePrice:ring.salePrice||0});setEditing(true);}},'✎ Edit'),
            h('button',{className:'btn btn-danger btn-sm',onClick:function(){if(confirm('Delete?'))onDelete(ring.id);}},'✕ Delete'),
            h('span',{style:{fontSize:12,color:'var(--txm)',marginLeft:'auto'}},'Labor: ',h('strong',null,fmt(ring.labor||0)))
          )
        :h('div',{className:'fp',style:{marginTop:10}},
            h('div',{className:'fp-t'},'Edit Ring'),
            h('div',{className:'fr'},
              h(FG,{label:'Name',style:{flex:'2 1 140px'}},h('input',{value:ern.name,onChange:function(e){setErn(Object.assign({},ern,{name:e.target.value}));}})),
              h(FG,{label:'Description',style:{flex:'2 1 140px'}},h('input',{value:ern.desc,onChange:function(e){setErn(Object.assign({},ern,{desc:e.target.value}));},placeholder:'Optional'})),
              h(FG,{label:'Labor ($)',style:{flex:'1 1 90px'}},h('input',{type:'number',min:0,step:.01,value:ern.labor,onChange:function(e){setErn(Object.assign({},ern,{labor:e.target.value}));}})),
              h(FG,{label:'Sale Price ($)',style:{flex:'1 1 100px'}},h('input',{type:'number',min:0,step:.01,value:ern.salePrice,onChange:function(e){setErn(Object.assign({},ern,{salePrice:e.target.value}));},placeholder:'0.00'}))
            ),
            h('div',{className:'fa'},
              h('button',{className:'btn btn-gold btn-sm',onClick:saveEdit},'Save'),
              h('button',{className:'btn btn-ghost btn-sm',onClick:function(){setEditing(false);}},'Cancel')
            )
          ),
      ring.comps.length>0&&h('table',{className:'tbl'},
        h('thead',null,h('tr',null,h('th',null,'Component'),h('th',{className:'r'},'Qty'),h('th',{className:'r'},'Unit'),h('th',{className:'r'},'Unit Cost'),h('th',{className:'r'},'Subtotal'),h('th',null,''))),
        h('tbody',null,
          ring.comps.map(function(c){
            var uc=compCost(c,sm,rm),sub=(+c.qty||0)*uc;
            if(editCIdS===c.id){
              return h(InlineEdit,{key:c.id,c:c,ring:ring,onUpdate:onUpdate,onDone:function(){setEditCId(null);}});
            }
            var bdg=c.ringId?h('span',{className:'bdg bdg-p'},'prereq'):c.siId?h('span',{className:'bdg bdg-s'},'secondary'):null;
            return h('tr',{key:c.id},
              h('td',null,c.name,bdg),h('td',{className:'r'},fq(c.qty)),h('td',{className:'r'},c.unit),h('td',{className:'r'},fmt(uc)),h('td',{className:'r'},fmt(sub)),
              h('td',null,h('div',{style:{display:'flex',gap:3,justifyContent:'flex-end'}},
                h('button',{className:'ib',onClick:function(){setEditCId(c.id);}},'✎'),
                h('button',{className:'ib d',onClick:function(){onUpdate(Object.assign({},ring,{comps:ring.comps.filter(function(x){return x.id!==c.id;})}));}},'✕')
              ))
            );
          }),
          h('tr',{className:'ttr'},h('td',{colSpan:4,style:{paddingLeft:8}},'Materials subtotal'),h('td',{className:'r'},fmt(mats)),h('td',null)),
          h('tr',{className:'ttr'},h('td',{colSpan:4,style:{paddingLeft:8}},'Labor'),h('td',{className:'r'},fmt(ring.labor||0)),h('td',null)),
          h('tr',{className:'tgr'},h('td',{colSpan:4,style:{paddingLeft:8}},'Total cost'),h('td',{className:'r'},fmt(total)),h('td',null))
        )
      ),
      !ring.comps.length&&h('p',{style:{fontSize:12,color:'var(--txm)',padding:'10px 0 3px',fontStyle:'italic'}},'No components yet.'),
      addingS!==null
        ?h(AddCompPanel,{tab:addingS,onTabChange:setAdding,db:db,maps:maps,currentRingId:ring.id,
            onAdd:function(c){onUpdate(Object.assign({},ring,{comps:ring.comps.concat([Object.assign({id:uid()},c)])}));setAdding(null);},
            onCancel:function(){setAdding(null);}})
        :h('button',{className:'btn btn-ghost btn-sm',style:{marginTop:8},onClick:function(){setAdding('raw');}},'+ Add Component')
    )
  );
}

function InlineEdit(props){
  var c=props.c,ring=props.ring,onUpdate=props.onUpdate,onDone=props.onDone;
  var locked=!!(c.siId||c.ringId);
  var ecS=useState(Object.assign({},c)),setEc=ecS[1]; var ec=ecS[0];
  return h('tr',null,h('td',{colSpan:6},
    h('div',{className:'ie'},
      h('div',{className:'fr'},
        h(FG,{label:'Name',style:{flex:'2 1 100px'}},h('input',{value:ec.name,disabled:locked,onChange:function(e){setEc(Object.assign({},ec,{name:e.target.value}));}})),
        h(FG,{label:'Qty',style:{flex:'1 1 60px'}},h('input',{type:'number',min:0,step:'any',value:ec.qty,onChange:function(e){setEc(Object.assign({},ec,{qty:e.target.value}));}})),
        h(FG,{label:'Unit',style:{flex:'1 1 60px'}},h(UnitSel,{value:ec.unit,onChange:function(e){setEc(Object.assign({},ec,{unit:e.target.value}));}})),
        !locked&&h(FG,{label:'Cost ($)',style:{flex:'1 1 80px'}},h('input',{type:'number',min:0,step:'any',value:ec.cost,onChange:function(e){setEc(Object.assign({},ec,{cost:e.target.value}));}}))
      ),
      h('div',{className:'fa'},
        h('button',{className:'btn btn-gold btn-sm',onClick:function(){
          onUpdate(Object.assign({},ring,{comps:ring.comps.map(function(x){return x.id===ec.id?Object.assign({},ec,{qty:parseFloat(ec.qty)||0,cost:parseFloat(ec.cost)||0}):x;})}));
          onDone();
        }},'Save'),
        h('button',{className:'btn btn-ghost btn-sm',onClick:onDone},'Cancel')
      )
    )
  ));
}

// ── Add SI / Ring Forms ──────────────────────────────────────────────────
function AddSIForm(props){
  var onAdd=props.onAdd,onCancel=props.onCancel;
  var nameS=useState(''),setName=nameS[1]; nameS=nameS[0];
  var oQtyS=useState('1'),setOQty=oQtyS[1]; oQtyS=oQtyS[0];
  var oUnitS=useState('pcs'),setOUnit=oUnitS[1]; oUnitS=oUnitS[0];
  var iNameS=useState(''),setIName=iNameS[1]; iNameS=iNameS[0];
  var iQtyS=useState(''),setIQty=iQtyS[1]; iQtyS=iQtyS[0];
  var iUnitS=useState('pcs'),setIUnit=iUnitS[1]; iUnitS=iUnitS[0];
  var iCostS=useState(''),setICost=iCostS[1]; iCostS=iCostS[0];
  function add(){
    if(!nameS.trim())return;
    onAdd({id:uid(),name:nameS.trim(),oQty:parseFloat(oQtyS)||1,oUnit:oUnitS,
      inputs:iNameS.trim()?[{id:uid(),name:iNameS.trim(),qty:parseFloat(iQtyS)||0,unit:iUnitS,cost:parseFloat(iCostS)||0}]:[]});
  }
  return h('div',{className:'fp',style:{marginBottom:9}},
    h('div',{className:'fp-t'},'New Secondary Ingredient'),
    h('div',{className:'fr',style:{marginBottom:7}},
      h(FG,{label:'Name',style:{flex:'2 1 140px'}},h('input',{value:nameS,onChange:function(e){setName(e.target.value);},placeholder:'e.g. Bronze Alloy'})),
      h(FG,{label:'Output Qty',style:{flex:'1 1 65px'}},h('input',{type:'number',min:1,value:oQtyS,onChange:function(e){setOQty(e.target.value);}})),
      h(FG,{label:'Unit',style:{flex:'1 1 60px'}},h(UnitSel,{value:oUnitS,onChange:function(e){setOUnit(e.target.value);}}))
    ),
    h('hr',{className:'fd'}),
    h('p',{style:{fontSize:11,color:'var(--txm)',marginBottom:7,fontStyle:'italic'}},'First input material'),
    h('div',{className:'fr'},
      h(FG,{label:'Material',style:{flex:'2 1 135px'}},h('input',{value:iNameS,onChange:function(e){setIName(e.target.value);},placeholder:'e.g. Silver Ingot'})),
      h(FG,{label:'Qty',style:{flex:'1 1 60px'}},h('input',{type:'number',min:0,step:'any',value:iQtyS,onChange:function(e){setIQty(e.target.value);}})),
      h(FG,{label:'Unit',style:{flex:'1 1 60px'}},h(UnitSel,{value:iUnitS,onChange:function(e){setIUnit(e.target.value);}})),
      h(FG,{label:'Unit Cost ($)',style:{flex:'1 1 80px'}},h('input',{type:'number',min:0,step:'any',value:iCostS,onChange:function(e){setICost(e.target.value);},placeholder:'0.00'}))
    ),
    h('div',{className:'fa'},h('button',{className:'btn btn-gold btn-sm',onClick:add},'Create'),h('button',{className:'btn btn-ghost btn-sm',onClick:onCancel},'Cancel'))
  );
}

function AddRingForm(props){
  var onAdd=props.onAdd,onCancel=props.onCancel;
  var nameS=useState(''),setName=nameS[1]; nameS=nameS[0];
  var descS=useState(''),setDesc=descS[1]; descS=descS[0];
  var laborS=useState('0'),setLabor=laborS[1]; laborS=laborS[0];
  var spS=useState('0'),setSp=spS[1]; spS=spS[0];
  function add(){
    if(!nameS.trim())return;
    onAdd({id:uid(),name:nameS.trim(),desc:descS.trim(),labor:parseFloat(laborS)||0,salePrice:parseFloat(spS)||0,comps:[]});
  }
  return h('div',{className:'fp',style:{marginBottom:9}},
    h('div',{className:'fp-t'},'New Ring'),
    h('div',{className:'fr'},
      h(FG,{label:'Ring Name',style:{flex:'2 1 150px'}},h('input',{value:nameS,onChange:function(e){setName(e.target.value);},placeholder:'e.g. Diamond Ring'})),
      h(FG,{label:'Description',style:{flex:'2 1 150px'}},h('input',{value:descS,onChange:function(e){setDesc(e.target.value);},placeholder:'Optional'})),
      h(FG,{label:'Labor ($)',style:{flex:'1 1 85px'}},h('input',{type:'number',min:0,step:.01,value:laborS,onChange:function(e){setLabor(e.target.value);}})),
      h(FG,{label:'Sale Price ($)',style:{flex:'1 1 95px'}},h('input',{type:'number',min:0,step:.01,value:spS,onChange:function(e){setSp(e.target.value);},placeholder:'0.00'}))
    ),
    h('div',{className:'fa'},h('button',{className:'btn btn-gold btn-sm',onClick:add},'Create Ring'),h('button',{className:'btn btn-ghost btn-sm',onClick:onCancel},'Cancel'))
  );
}

// ── Recipe Modal ─────────────────────────────────────────────────────────
function RecipeModal(props){
  var db=props.db,onClose=props.onClose;
  var selS=useState(props.ringId||''),setSel=selS[1]; var sel=selS[0];
  var maps=useMemo(function(){return makeMaps(db);},[db]);
  var sm=maps.sm,rm=maps.rm;
  var ring=rm[sel];
  var list=ring?buildCraftingList(ring,sm,rm):null;
  var total=ring?ringCost(ring,sm,rm):0;
  return h('div',{className:'modal-overlay',onClick:onClose},
    h('div',{className:'modal',onClick:function(e){e.stopPropagation();}},
      h('div',{className:'modal-hdr'},
        h('div',{className:'modal-title'},'\u25c6 Full Recipe'),
        h('button',{className:'ib',onClick:onClose},'\u2715')
      ),
      h('div',{className:'modal-body'},
        h(FG,{label:'Ring',style:{marginBottom:14}},
          h('select',{value:sel,onChange:function(e){setSel(e.target.value);},style:{width:'100%',fontSize:14,padding:'8px 10px',background:'var(--onyx-light)',color:'var(--tx)',border:'1px solid var(--onyx-border)',borderRadius:6,cursor:'pointer'}},
            h('option',{value:''},'\u2014 Choose a ring \u2014'),
            db.rings.filter(function(r){return r.comps.length>0;}).map(function(r){return h('option',{key:r.id,value:r.id},r.name+' \u2014 '+fmt(ringCost(r,sm,rm)));})
          )
        ),
        ring&&list&&h('div',null,
          h('div',{className:'rsumm'},
            h('div',{className:'rsc'},h('div',{className:'rsc-v'},list.crafted.length),h('div',{className:'rsc-l'},'Items to Craft')),
            h('div',{className:'rsc'},h('div',{className:'rsc-v'},list.raw.length),h('div',{className:'rsc-l'},'Raw Materials')),
            h('div',{className:'rsc'},h('div',{className:'rsc-v'},fmt(total)),h('div',{className:'rsc-l'},'Total Cost'))
          ),
          list.crafted.length>0&&h('div',null,
            h('div',{className:'rsh'},h('h3',{style:{color:'#8AE064'}},'\u25c8 Items to Craft'),h('span',{className:'rsh-cnt'},list.crafted.length),h('div',{className:'rsh-line'})),
            list.crafted.map(function(item,i){
              return h('div',{key:i,className:'rl-item '+(item.type==='si'?'rl-si':'rl-ring')},
                h('span',{style:{fontSize:10,color:item.type==='si'?'#E07AE0':'#8AE064',flexShrink:0}},item.type==='si'?'\u25ce':'\u25c8'),
                h('span',{className:'rl-name'},item.name),
                h('span',{className:'rl-type '+(item.type==='si'?'lt-si':'lt-ring')},item.type==='si'?'secondary':'sub-craft'),
                h('span',{className:'rl-qty'},fq(item.qty),' ',h('span',{style:{fontSize:10,fontWeight:400,color:'var(--txm)'}},item.unit)),
                h('span',{className:'rl-cost'},fmt(item.total))
              );
            })
          ),
          list.raw.length>0&&h('div',null,
            h('div',{className:'rsh',style:{marginTop:14}},h('h3',{style:{color:'var(--gold)'}},'\u25c6 Raw Materials'),h('span',{className:'rsh-cnt'},list.raw.length),h('div',{className:'rsh-line'})),
            list.raw.map(function(item,i){
              return h('div',{key:i,className:'rl-item rl-raw'},
                h(GemDot,{name:item.name,style:{flexShrink:0}}),
                h('span',{className:'rl-name'},item.name),
                h('span',{className:'rl-type lt-raw'},'raw'),
                h('span',{className:'rl-qty'},fq(item.qty),' ',h('span',{style:{fontSize:10,fontWeight:400,color:'var(--txm)'}},item.unit)),
                h('span',{className:'rl-cost'},fmt(item.total))
              );
            })
          ),
          h('div',{className:'rl-tot'},
            h('span',{style:{fontFamily:'Cinzel,serif',fontSize:11,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--gold-light)'}},'Grand Total'),
            h('span',{style:{fontFamily:'Cinzel,serif',fontSize:17,fontWeight:600,color:'var(--gold-light)'}},fmt(total))
          )
        )
      )
    )
  );
}

// ── Database Tab ─────────────────────────────────────────────────────────
function DatabaseTab(props){
  var db=props.db,setDb=props.setDb,onViewRecipe=props.onViewRecipe;
  var addSIState=useState(false),setAddSI=addSIState[1]; var addSI=addSIState[0];
  var addRingState=useState(false),setAddRing=addRingState[1]; var addRing=addRingState[0];
  var maps=useMemo(function(){return makeMaps(db);},[db]);
  var sm=maps.sm,rm=maps.rm;
  var fin=db.rings.filter(function(r){return r.comps.length>0;});
  var most=fin.length?fin.reduce(function(a,b){return ringCost(a,sm,rm)>=ringCost(b,sm,rm)?a:b;}):null;
  var cheap=fin.length?fin.reduce(function(a,b){return ringCost(a,sm,rm)<=ringCost(b,sm,rm)?a:b;}):null;
  var tc=db.rings.reduce(function(s,r){return s+r.comps.length;},0);
  var gemIds=['4','5','6','7','8','9'];
  var gemRings=db.rings.filter(function(r){return gemIds.indexOf(r.id)>=0&&r.comps.length>0;});

  return h('div',null,
    h('div',{className:'metrics'},
      h('div',{className:'mc'},h('div',{className:'mc-lbl'},'Total Rings'),h('div',{className:'mc-val'},db.rings.length)),
      h('div',{className:'mc'},h('div',{className:'mc-lbl'},'Components'),h('div',{className:'mc-val'},tc)),
      h('div',{className:'mc'},h('div',{className:'mc-lbl'},'Secondary Ingredients'),h('div',{className:'mc-val'},db.si.length)),
      most&&h('div',{className:'mc'},h('div',{className:'mc-lbl'},'Most Expensive'),h('div',{className:'mc-val',style:{fontSize:13,paddingTop:4}},most.name),h('div',{className:'mc-sub'},fmt(ringCost(most,sm,rm)))),
      cheap&&h('div',{className:'mc'},h('div',{className:'mc-lbl'},'Most Affordable'),h('div',{className:'mc-val',style:{fontSize:13,paddingTop:4}},cheap.name),h('div',{className:'mc-sub'},fmt(ringCost(cheap,sm,rm))))
    ),
    gemRings.length>0&&h('div',{className:'fp',style:{marginBottom:12}},
      h('div',{className:'fp-t'},'Gem Ring Comparison'),
      h('div',{className:'cmp-grid'},gemRings.map(function(r){
        var cost=ringCost(r,sm,rm);
        var gem=r.comps.find(function(c){return !c.siId&&!c.ringId;});
        return h('div',{key:r.id,className:'cmp-c'},
          h('span',{className:'cmp-gem '+gemCls(r.name)}),
          h('div',{className:'cmp-n'},r.name.replace(' Ring','')),
          h('div',{className:'cmp-v'},fmt(cost)),
          gem&&h('div',{className:'cmp-i'},gem.qty+'\u00d7 '+gem.name)
        );
      }))
    ),
    h('div',{className:'sh'},h('h2',null,'\u25c8 Secondary Ingredients'),h('div',{className:'sh-line'})),
    addSI&&h(AddSIForm,{
      onAdd:function(si){setDb(function(d){var nd=Object.assign({},d,{si:d.si.concat([si])});saveDB(nd);return nd;});setAddSI(false);},
      onCancel:function(){setAddSI(false);}
    }),
    db.si.map(function(si){
      return h(SICard,{key:si.id,si:si,
        onUpdate:function(u){setDb(function(d){var nd=Object.assign({},d,{si:d.si.map(function(s){return s.id===u.id?u:s;})});saveDB(nd);return nd;});},
        onDelete:function(id){setDb(function(d){var nd=Object.assign({},d,{si:d.si.filter(function(s){return s.id!==id;})});saveDB(nd);return nd;});}
      });
    }),
    !addSI&&h('button',{className:'btn btn-ghost btn-sm',style:{marginTop:4},onClick:function(){setAddSI(true);}},'+ Add Secondary Ingredient'),
    h('div',{className:'sh',style:{marginTop:22}},h('h2',null,'\u25c6 Rings'),h('div',{className:'sh-line'})),
    addRing&&h(AddRingForm,{
      onAdd:function(r){setDb(function(d){var nd=Object.assign({},d,{rings:d.rings.concat([r])});saveDB(nd);return nd;});setAddRing(false);},
      onCancel:function(){setAddRing(false);}
    }),
    db.rings.map(function(ring){
      return h(RingCard,{key:ring.id,ring:ring,db:db,maps:maps,
        onUpdate:function(u){setDb(function(d){var nd=Object.assign({},d,{rings:d.rings.map(function(r){return r.id===u.id?u:r;})});saveDB(nd);return nd;});},
        onDelete:function(id){setDb(function(d){var nd=Object.assign({},d,{rings:d.rings.filter(function(r){return r.id!==id;})});saveDB(nd);return nd;});},
        onViewRecipe:onViewRecipe
      });
    }),
    h('button',{className:'btn btn-gold btn-sm',style:{marginTop:7},onClick:function(){setAddRing(true);}},'+ New Ring')
  );
}

// ── Recipe Tab ───────────────────────────────────────────────────────────
function RecipeTab(props){
  var db=props.db;
  var selState=useState(''),setSel=selState[1]; var sel=selState[0];
  var maps=useMemo(function(){return makeMaps(db);},[db]);
  var sm=maps.sm,rm=maps.rm;
  var ring=rm[sel];
  var list=ring?buildCraftingList(ring,sm,rm):null;
  var total=ring?ringCost(ring,sm,rm):0;
  return h('div',{style:{maxWidth:720,margin:'0 auto'}},
    h(FG,{label:'Ring',style:{marginBottom:16}},
      h('select',{value:sel,onChange:function(e){setSel(e.target.value);},style:{width:'100%',fontSize:15,padding:'9px 12px',background:'var(--onyx-light)',color:'var(--tx)',border:'1px solid var(--onyx-border)',borderRadius:6,cursor:'pointer'}},
        h('option',{value:''},'\u2014 Choose a ring \u2014'),
        db.rings.filter(function(r){return r.comps.length>0;}).map(function(r){return h('option',{key:r.id,value:r.id},r.name+' \u2014 '+fmt(ringCost(r,sm,rm)));})
      )
    ),
    ring&&list&&h('div',null,
      h('div',{className:'rsumm'},
        h('div',{className:'rsc'},h('div',{className:'rsc-v'},list.crafted.length),h('div',{className:'rsc-l'},'Items to Craft')),
        h('div',{className:'rsc'},h('div',{className:'rsc-v'},list.raw.length),h('div',{className:'rsc-l'},'Raw Materials')),
        h('div',{className:'rsc'},h('div',{className:'rsc-v'},fmt(total)),h('div',{className:'rsc-l'},'Total Cost'))
      ),
      list.crafted.length>0&&h('div',null,
        h('div',{className:'rsh'},h('h3',{style:{color:'#8AE064'}},'\u25c8 Items to Craft'),h('span',{className:'rsh-cnt'},list.crafted.length),h('div',{className:'rsh-line'})),
        list.crafted.map(function(item,i){
          return h('div',{key:i,className:'rl-item '+(item.type==='si'?'rl-si':'rl-ring')},
            h('span',{style:{fontSize:10,color:item.type==='si'?'#E07AE0':'#8AE064',flexShrink:0}},item.type==='si'?'\u25ce':'\u25c8'),
            h('span',{className:'rl-name'},item.name),
            h('span',{className:'rl-type '+(item.type==='si'?'lt-si':'lt-ring')},item.type==='si'?'secondary':'sub-craft'),
            h('span',{className:'rl-qty'},fq(item.qty),' ',h('span',{style:{fontSize:10,fontWeight:400,color:'var(--txm)'}},item.unit)),
            h('span',{className:'rl-cost'},fmt(item.total))
          );
        })
      ),
      list.raw.length>0&&h('div',null,
        h('div',{className:'rsh',style:{marginTop:14}},h('h3',{style:{color:'var(--gold)'}},'\u25c6 Raw Materials'),h('span',{className:'rsh-cnt'},list.raw.length),h('div',{className:'rsh-line'})),
        list.raw.map(function(item,i){
          return h('div',{key:i,className:'rl-item rl-raw'},
            h(GemDot,{name:item.name,style:{flexShrink:0}}),
            h('span',{className:'rl-name'},item.name),
            h('span',{className:'rl-type lt-raw'},'raw'),
            h('span',{className:'rl-qty'},fq(item.qty),' ',h('span',{style:{fontSize:10,fontWeight:400,color:'var(--txm)'}},item.unit)),
            h('span',{className:'rl-cost'},fmt(item.total))
          );
        })
      ),
      h('div',{className:'rl-tot'},
        h('span',{style:{fontFamily:'Cinzel,serif',fontSize:11,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--gold-light)'}},'Grand Total'),
        h('span',{style:{fontFamily:'Cinzel,serif',fontSize:17,fontWeight:600,color:'var(--gold-light)'}},fmt(total))
      )
    )
  );
}

// ── Sales Tab ────────────────────────────────────────────────────────────
function SalesTab(props){
  var db=props.db;
  var saved=loadSales();
  var ordersState=useState(saved.orders||[]),setOrders=ordersState[1]; var orders=ordersState[0];
  var gsState=useState(saved.globalSupplied||[]),setGs=gsState[1]; var gs=gsState[0];
  var roState=useState({}),setRo=roState[1]; var ro=roState[0];
  var maps=useMemo(function(){return makeMaps(db);},[db]);
  var sm=maps.sm,rm=maps.rm;

  function persist(o,g){saveSales({orders:o,globalSupplied:g});}
  function updO(o){setOrders(o);persist(o,gs);}
  function updG(g){setGs(g);persist(orders,g);}

  function addOrder(){updO(orders.concat([{id:uid(),ringId:''}]));}
  function removeOrder(id){
    var no=orders.filter(function(o){return o.id!==id;});
    var ng=gs.filter(function(s){return !(s.fromCheck&&s.fromOrderId===id);});
    setOrders(no);setGs(ng);persist(no,ng);
  }
  function changeRing(oid,rid){
    var no=orders.map(function(o){return o.id===oid?Object.assign({},o,{ringId:rid}):o;});
    var ng=gs.filter(function(s){return !(s.fromCheck&&s.fromOrderId===oid);});
    setOrders(no);setGs(ng);persist(no,ng);
    setRo(function(r){var x=Object.assign({},r);x[oid]=false;return x;});
  }
  function checkMat(oid,name,unit,qty,unitCost,checked){
    var ng=gs.filter(function(s){return !(s.name===name&&s.unit===unit&&s.fromCheck&&s.fromOrderId===oid);});
    if(checked)ng=ng.concat([{id:uid(),name:name,qty:qty,unit:unit,unitCost:unitCost,fromCheck:true,fromOrderId:oid}]);
    updG(ng);
  }
  function removeSupply(id){updG(gs.filter(function(s){return s.id!==id;}));}

  var totalSaving=gs.reduce(function(s,x){return s+(+x.qty||0)*(+x.unitCost||0);},0);
  var grandFull=orders.reduce(function(s,o){var r=rm[o.ringId];return s+(r?ringCost(r,sm,rm):0);},0);
  var grandSale=orders.reduce(function(s,o){var r=rm[o.ringId];return s+(r&&r.salePrice?r.salePrice:0);},0);
  var grandYours=Math.max(0,grandFull-totalSaving);
  var adjustedSale=Math.max(0,grandSale-totalSaving);
  var profit=adjustedSale-grandYours;

  var allMats=useMemo(function(){
    var map={};
    orders.forEach(function(o){
      var r=rm[o.ringId];if(!r)return;
      getAllMats(r,sm,rm).forEach(function(m){var k=m.name+'||'+m.unit;if(!map[k])map[k]={name:m.name,unit:m.unit,unitCost:m.unitCost};});
    });
    return Object.values(map).sort(function(a,b){return a.name.localeCompare(b.name);});
  },[orders,rm,sm]);

  function lookupCost(name){var m=allMats.find(function(x){return x.name.toLowerCase()===name.toLowerCase();});return m?m.unitCost:0;}

  var gsNameState=useState(''),setGsName=gsNameState[1]; var gsName=gsNameState[0];
  var gsQtyState=useState(''),setGsQty=gsQtyState[1]; var gsQty=gsQtyState[0];
  var gsUnitState=useState('pcs'),setGsUnit=gsUnitState[1]; var gsUnit=gsUnitState[0];
  var gsCostState=useState(''),setGsCost=gsCostState[1]; var gsCost=gsCostState[0];

  function addGlobal(){
    var n=gsName.trim();if(!n)return;
    var q=parseFloat(gsQty)||0;if(!q)return;
    var c=parseFloat(gsCost)||lookupCost(n);
    updG(gs.concat([{id:uid(),name:n,qty:q,unit:gsUnit,unitCost:c,fromCheck:false,fromOrderId:null}]));
    setGsName('');setGsQty('');setGsCost('');
  }
  function clearAll(){if(!confirm('Clear all orders?'))return;setOrders([]);setGs([]);persist([],[]);}

  return h('div',null,
    orders.length===0
      ?h('div',{style:{background:'var(--onyx-mid)',border:'1px solid var(--onyx-border)',borderRadius:6,padding:28,textAlign:'center'}},
          h('div',{style:{fontFamily:'Cinzel,serif',fontSize:11,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--txm)',marginBottom:7}},'No Items in Order'),
          h('div',{style:{fontSize:13,color:'var(--txm)',fontStyle:'italic'}},'Click \u201c+ Add Ring\u201d to begin')
        )
      :orders.map(function(order,idx){
          var ring=rm[order.ringId];
          var mats=ring?getAllMats(ring,sm,rm):[];
          var rOpen=!!ro[order.id];
          return h('div',{key:order.id,className:'oc'},
            h('div',{className:'oc-hdr'},
              h('span',{className:'oc-num'},'Item '+(idx+1)),
              h('span',{className:'oc-name'},ring?ring.name:'Select a ring'),
              ring&&h('span',{className:'oc-cpill'},fmt(ringCost(ring,sm,rm))),
              h('button',{className:'ib d',style:{marginLeft:8},onClick:function(){removeOrder(order.id);}},'\u2715')
            ),
            h('div',{className:'oc-body'},
              h(FG,{label:'Ring',style:{marginBottom:11}},
                h('select',{value:order.ringId,onChange:function(e){changeRing(order.id,e.target.value);},style:{width:'100%',fontSize:14,padding:'6px 8px',background:'var(--onyx-mid)',color:'var(--tx)',border:'1px solid var(--onyx-border)',borderRadius:6}},
                  h('option',{value:''},'\u2014 Select a ring \u2014'),
                  db.rings.filter(function(r){return r.comps.length>0;}).map(function(r){return h('option',{key:r.id,value:r.id},r.name+' \u2014 '+fmt(ringCost(r,sm,rm)));})
                )
              ),
              ring&&h('div',null,
                h('div',{className:'rt',onClick:function(){setRo(function(x){var n=Object.assign({},x);n[order.id]=!n[order.id];return n;});}},
                  h('span',{className:'rt-lbl'},'\u25c6 Recipe Materials (',mats.length,' items \u2014 check to mark as supplied)'),
                  h('span',{className:'rt-chev'},rOpen?'\u25b2':'\u25bc')
                ),
                rOpen&&h('div',{className:'rdrop'},mats.map(function(mat,mi){
                  var isS=gs.some(function(s){return s.name===mat.name&&s.unit===mat.unit&&s.fromCheck&&s.fromOrderId===order.id;});
                  var tcls=mat.type==='raw'?'lt-raw':mat.type==='si'?'lt-si':'lt-ring';
                  var tlbl=mat.type==='raw'?'raw':mat.type==='si'?'secondary':'sub-craft';
                  return h('div',{key:mi,className:'mr'},
                    h('input',{type:'checkbox',className:'mck',checked:isS,onChange:function(e){checkMat(order.id,mat.name,mat.unit,mat.qty,mat.unitCost,e.target.checked);}}),
                    h(GemDot,{name:mat.name,style:{flexShrink:0}}),
                    h('span',{className:'mn'+(isS?' strk':'')},mat.name),
                    h('span',{className:'mtype '+tcls},tlbl),
                    h('span',{className:'mqty'},fq(mat.qty),' ',mat.unit),
                    h('span',{className:'mcost'},fmt(mat.total))
                  );
                }))
              )
            )
          );
        }),
    h('div',{style:{display:'flex',gap:7,paddingTop:12,flexWrap:'wrap'}},
      h('button',{className:'btn btn-gold btn-sm',onClick:addOrder},'+ Add Ring to Order'),
      orders.length>0&&h('button',{className:'btn btn-danger btn-sm',onClick:clearAll},'\u2715 Clear All Orders')
    ),
    orders.length>0&&h('div',{className:'sp-block'},
      h('div',{className:'sp-hdr'},
        h('span',{className:'sp-title',style:{color:'#8AE064'}},'\u2713 Customer Supplied Materials'),
        totalSaving>0&&h('span',{style:{fontFamily:'Cinzel,serif',fontSize:9,letterSpacing:'.08em',textTransform:'uppercase',background:'rgba(106,201,74,.12)',color:'#8AE064',border:'1px solid rgba(106,201,74,.2)',padding:'2px 8px',borderRadius:100}},'Saving '+fmt(totalSaving))
      ),
      h('div',{className:'sp-body'},
        gs.length===0
          ?h('div',{className:'empty-note'},'No materials supplied yet. Check items in a recipe above or add manually below.')
          :gs.map(function(s){
              var sv=(+s.qty||0)*(+s.unitCost||0);
              var iIdx=orders.findIndex(function(o){return o.id===s.fromOrderId;});
              return h('div',{key:s.id,className:'sup-row'},
                h(GemDot,{name:s.name,style:{flexShrink:0}}),
                h('span',{className:'sn'},s.name),
                iIdx>=0&&h('span',{style:{fontFamily:'Cinzel,serif',fontSize:8,color:'var(--txm)',textTransform:'uppercase',letterSpacing:'.06em',padding:'1px 5px',border:'1px solid var(--onyx-border)',borderRadius:100,whiteSpace:'nowrap'}},'Item '+(iIdx+1)),
                h('span',{className:'sq'},fq(s.qty),' ',s.unit),
                h('span',{style:{fontSize:11,color:'var(--txm)',minWidth:75,textAlign:'right',fontVariantNumeric:'tabular-nums'}},fmt(s.unitCost)+' ea'),
                h('span',{className:'ss'},'-'+fmt(sv)),
                h('button',{className:'ib d',style:{marginLeft:4},onClick:function(){removeSupply(s.id);}},'\u2715')
              );
            }),
        h('div',{className:'add-sup'},
          h(FG,{label:'Material',style:{flex:'2 1 140px'}},
            h('input',{value:gsName,onChange:function(e){setGsName(e.target.value);},placeholder:'e.g. Gold Bar',list:'gs-dl'}),
            h('datalist',{id:'gs-dl'},allMats.map(function(m){return h('option',{key:m.name,value:m.name},m.name+' ('+fmt(m.unitCost)+'/'+m.unit+')');}))
          ),
          h(FG,{label:'Qty',style:{flex:'1 1 65px'}},h('input',{type:'number',min:0,step:'any',value:gsQty,onChange:function(e){setGsQty(e.target.value);},placeholder:'1'})),
          h(FG,{label:'Unit',style:{flex:'1 1 60px'}},h(UnitSel,{value:gsUnit,onChange:function(e){setGsUnit(e.target.value);}})),
          h(FG,{label:'Unit Cost ($)',style:{flex:'1 1 80px'}},h('input',{type:'number',min:0,step:'any',value:gsCost,onChange:function(e){setGsCost(e.target.value);},placeholder:'auto'})),
          h('button',{className:'btn btn-ghost btn-sm',style:{marginBottom:1},onClick:addGlobal},'+ Add')
        )
      )
    ),
    orders.length>0&&grandFull>0&&h('div',{className:'sp-block'},
      h('div',{className:'sp-hdr'},h('span',{className:'sp-title',style:{color:'var(--gold)'}},'\u25c6 Quote Summary')),
      h('div',{className:'sp-body'},
        orders.length>1&&orders.map(function(o,i){
          var r=rm[o.ringId];
          return r&&h('div',{key:o.id,className:'oq-row'},h('span',{className:'oq-lbl'},'Item '+(i+1)+' \u2014 '+r.name),h('span',{className:'oq-val'},fmt(ringCost(r,sm,rm))));
        }).filter(Boolean),
        h('div',{className:'oq-row'},h('span',{className:'oq-lbl'},orders.length>1?'Combined recipe cost':'Full recipe cost'),h('span',{className:'oq-val'},fmt(grandFull))),
        totalSaving>0&&h('div',null,
          h('div',{className:'oq-row'},h('span',{className:'oq-lbl oq-green'},'\u2212 Customer supplied'),h('span',{className:'oq-val oq-green'},'-'+fmt(totalSaving))),
          gs.map(function(s){
            var sv=(+s.qty||0)*(+s.unitCost||0);
            return h('div',{key:s.id,className:'oq-row',style:{paddingLeft:14,opacity:.75}},
              h('span',{className:'oq-lbl',style:{fontSize:12}},s.name+' \u00d7 '+fq(s.qty)+' '+s.unit+' @ '+fmt(s.unitCost)),
              h('span',{className:'oq-val oq-green',style:{fontSize:12}},'-'+fmt(sv))
            );
          })
        ),
        h('div',{className:'oq-tot',style:{background:'rgba(201,151,74,.06)',border:'1px solid rgba(201,151,74,.15)'}},
          h('span',{className:'oq-tot-lbl'},'Your crafting cost'),
          h('span',{className:'oq-tot-val'},fmt(grandYours))
        ),
        grandSale>0&&h('div',null,
          h('hr',{className:'fd'}),
          h('div',{className:'oq-row'},h('span',{className:'oq-lbl',style:{color:'var(--gold)'}},'Listed sale price'),h('span',{className:'oq-val',style:{color:'var(--gold-light)'}},fmt(grandSale))),
          totalSaving>0&&h('div',{className:'oq-row'},h('span',{className:'oq-lbl oq-green'},'\u2212 Customer supplied materials'),h('span',{className:'oq-val oq-green'},'-'+fmt(totalSaving))),
          h('div',{className:'oq-tot',style:{background:'rgba(106,201,74,.07)',border:'1px solid rgba(106,201,74,.18)',marginTop:6}},
            h('span',{className:'oq-tot-lbl',style:{color:'#8AE064'}},'Total Cost Owed to You'),
            h('span',{className:'oq-tot-val',style:{color:'#8AE064'}},fmt(adjustedSale))
          ),
          h('div',{className:'oq-row',style:{marginTop:5}},h('span',{className:'oq-lbl',style:{fontSize:12,color:'var(--txm)'}},'Your crafting cost'),h('span',{className:'oq-val',style:{fontSize:12}},fmt(grandYours))),
          h('div',{className:'oq-row'},
            h('span',{className:'oq-lbl',style:{fontSize:12,color:'var(--txm)'}},'Profit'),
            h('span',{className:'oq-val',style:{fontSize:12,color:profit>=0?'#8AE064':'var(--ruby)'}},( profit>=0?'+':'')+fmt(profit))
          )
        )
      )
    )
  );
}

// ── App ──────────────────────────────────────────────────────────────────
function App(){
  var tabState=useState('db'),setTab=tabState[1]; var tab=tabState[0];
  var dbState=useState(function(){return loadDB();}),setDb=dbState[1]; var db=dbState[0];
  var recipeIdState=useState(''),setRecipeId=recipeIdState[1]; var recipeId=recipeIdState[0];
  var showModalState=useState(false),setShowModal=showModalState[1]; var showModal=showModalState[0];

  function openRecipe(id){
    setRecipeId(id);
    if(tab==='db'){setShowModal(true);}
    else{setTab('recipe');}
  }

  return h('div',{className:'app'},
    h('div',{className:'hdr'},
      h('div',null,
        h('h1',null,'\u25c6 Ring Crafting Database'),
        h('p',null,'Crafting costs \u2014 from raw ore to finished jewel')
      )
    ),
    h('div',{className:'nav'},
      [['db','\u25c6 Database'],['recipe','\u25c7 Full Recipe'],['sales','\u2261 Sales']].map(function(pair){
        return h('button',{key:pair[0],className:'ntab'+(tab===pair[0]?' on':''),onClick:function(){setTab(pair[0]);}},pair[1]);
      })
    ),
    h('div',{className:'main'},
      tab==='db'&&h(DatabaseTab,{db:db,setDb:setDb,onViewRecipe:openRecipe}),
      tab==='recipe'&&h(RecipeTab,{db:db}),
      tab==='sales'&&h(SalesTab,{db:db}),
      showModal&&h(RecipeModal,{ringId:recipeId,db:db,onClose:function(){setShowModal(false);}})
    )
  );
}

ReactDOM.render(h(App),document.getElementById('root'));
