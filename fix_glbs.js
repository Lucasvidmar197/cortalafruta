const { createClient } = require('@supabase/supabase-js');
const { NodeIO } = require('@gltf-transform/core');
const { KHRMaterialsUnlit } = require('@gltf-transform/extensions');

const supabase = createClient('https://ianvjkwkguuwrvqoxooh.supabase.co', 'sb_publishable_k8ncei-GLsFiZo-PIic-Nw_IxTn43Z7');

async function fix() {
  console.log("Listing files...");
  const { data: files, error } = await supabase.storage.from('menu-assets').list();
  if (error) {
    console.error(error);
    return;
  }
  
  const io = new NodeIO().registerExtensions([KHRMaterialsUnlit]);
  
  for (const file of files) {
    if (file.name.endsWith('.glb')) {
      console.log(`Processing ${file.name}...`);
      const { data: blob } = await supabase.storage.from('menu-assets').download(file.name);
      if (blob) {
        try {
          const buffer = await blob.arrayBuffer();
          const doc = await io.readBinary(new Uint8Array(buffer));
          
          const unlitExtension = doc.createExtension(KHRMaterialsUnlit);
          const unlit = unlitExtension.createUnlit();
          
          let modified = false;
          for (const material of doc.getRoot().listMaterials()) {
            if (!material.getExtension('KHR_materials_unlit')) {
              material.setExtension('KHR_materials_unlit', unlit);
              material.setMetallicFactor(0);
              material.setRoughnessFactor(1);
              modified = true;
            }
          }
          
          if (modified) {
            console.log(`Injecting unlit and uploading ${file.name}...`);
            const modifiedBuffer = await io.writeBinary(doc);
            const res = await supabase.storage.from('menu-assets').upload(file.name, modifiedBuffer, {
              upsert: true,
              contentType: 'model/gltf-binary'
            });
            console.log(res);
          } else {
            console.log(`Already unlit: ${file.name}`);
          }
        } catch(e) {
          console.error(`Failed on ${file.name}`, e);
        }
      }
    }
  }
  console.log("Done!");
}

fix();
