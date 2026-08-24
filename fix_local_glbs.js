const fs = require('fs');
const path = require('path');
const { NodeIO } = require('@gltf-transform/core');
const { KHRMaterialsUnlit } = require('@gltf-transform/extensions');

async function fixLocal() {
  const uploadDir = path.join(__dirname, 'public', 'uploads');
  const files = fs.readdirSync(uploadDir);
  const io = new NodeIO().registerExtensions([KHRMaterialsUnlit]);
  
  for (const file of files) {
    if (file.endsWith('.glb')) {
      const filePath = path.join(uploadDir, file);
      console.log(\Processing \...\);
      try {
        const buffer = fs.readFileSync(filePath);
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
          const modifiedBuffer = await io.writeBinary(doc);
          fs.writeFileSync(filePath, Buffer.from(modifiedBuffer));
          console.log(\Injected unlit into \\);
        } else {
          console.log(\Already unlit: \\);
        }
      } catch (e) {
        console.error(\Failed on \\, e);
      }
    }
  }
  console.log("Done!");
}

fixLocal();
