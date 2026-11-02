/* Les réglages propres à la version PC (la partie, elle, reste celle du jeu mobile). */
const KEY = "pcg.pc.settings";
const DEF = {quality:"haute", fov:72, sens:1, invertY:false, time:"reel", volume:0.8, music:0.5, hints:true};
export const Settings = Object.assign({}, DEF);
try { Object.assign(Settings, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch(e){}
export function saveSettings(){ try { localStorage.setItem(KEY, JSON.stringify(Settings)); } catch(e){} }
/* au premier lancement : une qualité selon la machine */
export function guessQuality(renderer){
  try {
    const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "").toLowerCase();
    if(/swiftshader|llvmpipe|software/.test(name)) return "basse";
    if(/intel|uhd|iris|mali|adreno|apple m1|apple gpu/.test(name)) return "moyenne";
    return "haute";
  } catch(e){ return "moyenne"; }
}
