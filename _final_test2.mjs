import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
const html = readFileSync("pages/element-dunia.page.html","utf8");
const stubs = `<script>
var __DB=[]; var __TYPES=[{id:1,projectId:1,name:"Spesies Custom",icon:"lucide:leaf",fields:[{key:"habitat",label:"Habitat",kind:"linked",linkedRef:"Lokasi"}],lastUpdated:""}];
Object.defineProperty(window,"localStorage",{value:{getItem:k=>null,setItem:()=>{},removeItem:()=>{}},configurable:true});
window.AetherState={
  available:true,getProjects:async()=>[{id:1,name:"T"}],getProject:async()=>({id:1,name:"T"}),getProjectByName:async()=>({id:1,name:"T"}),
  getElements:async(pid,t)=>__DB.filter(e=>e.projectId===pid&&(!t||e.type===t)),
  addElement:async(pid,e)=>{var id=__DB.length+1;var r=Object.assign({},e,{id,projectId:pid,lastUpdated:""});__DB.push(r);return r;},
  updateElement:async(i,u)=>{var x=__DB.findIndex(e=>e.id===i);if(x>=0){__DB[x]=Object.assign({},__DB[x],u);return __DB[x];}return null;},
  deleteElement:async(i)=>{__DB=__DB.filter(e=>e.id!==i);},logActivity:async()=>({}),
  getCustomTypes:async(pid)=>__TYPES.filter(t=>t.projectId===pid),
  addCustomType:async(pid,d)=>{var id=(__TYPES.length?Math.max.apply(null,__TYPES.map(t=>t.id||0))+1:1);var r=Object.assign({},d,{id,projectId:pid,lastUpdated:""});__TYPES.push(r);return r;},
  updateCustomType:async(i,u)=>{var x=__TYPES.findIndex(t=>t.id===i);if(x>=0){__TYPES[x]=Object.assign({},__TYPES[x],u);return __TYPES[x];}return null;},
  deleteCustomType:async(i)=>{__TYPES=__TYPES.filter(t=>t.id!==i);},
  deleteCustomTypeWithElements:async(i,pid,names)=>{var b=__DB.length;__DB=__DB.filter(e=>!(names||[]).includes(e.type));__TYPES=__TYPES.filter(t=>t.id!==i);return {deletedType:true,deletedElements:b-__DB.length};},
  countElementsOfType:async(pid,nm)=>__DB.filter(e=>e.projectId===pid&&e.type===nm).length,
  _findReverseFieldKey: function(targetType, sourceType) {
    var schema = window.AwbElementSchemas && window.AwbElementSchemas[targetType];
    if (!schema) return null;
    for (var i = 0; i < schema.length; i++) {
      var flds = schema[i].fields || [];
      for (var j = 0; j < flds.length; j++) {
        if (flds[j].kind === "linked" && (flds[j].linkedType === sourceType || flds[j].linkedRef === sourceType)) {
          return flds[j].key;
        }
      }
    }
    return null;
  },
  _syncBidirectionalLinks: function(db, sourceId, linkedElements, sourceType, projectId) {
    var promises = [];
    for (var fieldKey in linkedElements) {
      var links = linkedElements[fieldKey];
      if (!Array.isArray(links)) continue;
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (!link || !link.id) continue;
        var targetId = link.id;
        var targetType = link.type;
        var reverseKey = this._findReverseFieldKey(targetType, sourceType);
        if (!reverseKey) continue;
        promises.push(
          this.getElement(targetId).then(function(target) {
            if (!target) return;
            var targetData = target.data || {};
            var targetLinked = targetData.linkedElements || {};
            var reverseLinks = targetLinked[link.fieldKey] || [];
            var exists = reverseLinks.some(function(l) { return l && l.id === sourceId; });
            if (!exists) {
              reverseLinks.push({ id: sourceId, name: "", type: sourceType });
              targetLinked[link.fieldKey] = reverseLinks;
              return this.updateElement(targetId, {
                data: Object.assign({}, targetData, { linkedElements: targetLinked }),
                lastUpdated: new Date().toISOString()
              });
            }
          })
        );
      }
    }
    return Promise.all(promises);
  }
};
var __Q={getElements:t=>window.AetherState.getElements(1,t),addElement:d=>window.AetherState.addElement(1,d),updateElement:(i,d)=>window.AetherState.updateElement(i,d),deleteElement:i=>window.AetherState.deleteElement(i),logActivity:()=>Promise.resolve(),getCustomTypes:()=>window.AetherState.getCustomTypes(1),addCustomType:d=>window.AetherState.addCustomType(1,d),updateCustomType:(i,d)=>window.AetherState.updateCustomType(i,d),deleteCustomType:i=>window.AetherState.deleteCustomType(i),deleteCustomTypeWithElements:(i,n)=>window.AetherState.deleteCustomTypeWithElements(i,1,n),countElementsOfType:nm=>window.AetherState.countElementsOfType(1,nm)};
window.AetherPageUtils={initPage:async()=>({query:__Q,project:{id:1,name:"T"},projectId:1,setActiveProject:()=>{}})};
window.elementDuniaQuery=__Q;window.__getTypes=()=>__TYPES;window.__getDB=()=>__DB;
</script>`;
const dom=new JSDOM(html.replace("</head>",stubs+"</head>"),{runScripts:"dangerously",url:"http://localhost/",pretendToBeVisual:true});
const w=dom.window,d=w.document;const o=d.querySelectorAll.bind(d);d.querySelectorAll=function(s){return Array.from(o(s));};
const fire=(el,ev,key)=>el.dispatchEvent(new (key?w.KeyboardEvent:w.Event)(ev,{bubbles:true,key}));
["public/js/element-dunia/schemas/types/spesies.js","public/js/element-dunia/schemas/index.js","public/js/element-dunia/form-renderer.js","public/js/element-dunia/custom-types.js","public/js/element-dunia/state.js","public/js/element-dunia/render.js","public/js/element-dunia/form.js","public/js/element-dunia/events.js","public/js/element-dunia/index.js"].forEach(p=>{const s=d.createElement("script");s.textContent=readFileSync(p,"utf8");d.head.appendChild(s);});
await new Promise(r=>setTimeout(r,500));
let pass=0,fail=0;function check(n,c,x=""){if(c){pass++;console.log("  ✓ "+n+(x?" ("+x+")":""))}else{fail++;console.log("  ✗ "+n+(x?" ("+x+")":""))}}
const wait=(ms=80)=>new Promise(r=>setTimeout(r,ms));

console.log("=== TEST LINKED FIELD ===");

// 1. Buat element Lokasi
d.getElementById("btn-entry-element").click(); await wait(50);
const pickL=d.querySelector('[data-pick-type="Lokasi"]');
check("picker Lokasi ada", !!pickL);
pickL.click(); await wait(60);
const body=d.querySelector("#modal-buat-element-body");
body.querySelector('[data-field="name"]').value="Hutan Anggrek";
d.getElementById("btn-simpan-element").click(); await wait(200);
const lokasi=w.__getDB().find(e=>e.name==="Hutan Anggrek");
check("Lokasi Hutan Anggrek dibuat", !!lokasi, "lokasi="+!!lokasi);

// 2. Buat element Spesies Custom dengan linked habitat ke Lokasi
d.getElementById("btn-entry-element").click(); await wait(50);
const pickSC=d.querySelector('[data-pick-type="Spesies Custom"]');
check("picker Spesies Custom ada", !!pickSC);
pickSC.click(); await wait(60);
const body2=d.querySelector("#modal-buat-element-body");
const habitatWrap=body2.querySelector('[data-key="habitat"]');
check("habitat field (linked) render", !!habitatWrap);
const habitatInput=habitatWrap?.querySelector('[data-linked-input]');
check("linked input data-linked-type=Lokasi", habitatInput?.getAttribute("data-linked-type")==="Lokasi", "type="+(habitatInput?.getAttribute("data-linked-type")||"NULL"));

habitatInput.value="Hutan Anggrek"; fire(habitatInput,"keydown","Enter"); await wait(50);
body2.querySelector('[data-field="name"]').value="Kelinci Hutan";
d.getElementById("btn-simpan-element").click(); await wait(400);

const kelinci=w.__getDB().find(e=>e.name==="Kelinci Hutan");
check("Spesies Custom Kelinci Hutan dibuat", !!kelinci);
check("Linked habitat tersimpan dengan ID", kelinci&&kelinci.data.linkedElements&&kelinci.data.linkedElements.habitat&&kelinci.data.linkedElements.habitat[0].id);
check("Linked habitat type=Lokasi", kelinci&&kelinci.data.linkedElements.habitat[0].type==="Lokasi", "type="+kelinci?.data.linkedElements.habitat[0].type);

console.log("\n=== Bi-directional: Lokasi harus punya link balik ===");
const lokasi2=w.__getDB().find(e=>e.name==="Hutan Anggrek");
check("Lokasi punya linkedElements", lokasi2&&lokasi2.data.linkedElements);
const reverseKey = Object.keys(lokasi2.data.linkedElements||{}).find(k=>lokasi2.data.linkedElements[k]?.some(l=>l.id===kelinci.id));
check("Lokasi punya link balik ke Spesies Custom", !!reverseKey, "reverseKey="+reverseKey);
if (reverseKey) {
  check("Link balik ke Kelinci Hutan", lokasi2.data.linkedElements[reverseKey].some(l=>l.id===kelinci.id));
}

console.log("\n===== SUMMARY =====");
console.log("PASS:",pass,"FAIL:",fail);
process.exit(fail?1:0);
