import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function verifyDependencyContract(registry,lock,{production=false}={}){
 const repository='neophilism/Secure-Intake-Case-Workflow-Engine';
 if(!registry.units?.length)throw new Error('Canonical downstream work plan missing');
 for(const unit of registry.units)if(!unit.externalDependencies?.some(d=>d.repository===repository&&d.unitId==='SI-42'))
  throw new Error('Every downstream unit must retain the owner-required upstream stable-release prerequisite: '+unit.id);
 const pin=registry.runtimeDependencies?.find(d=>d.repository===repository);
 if(!pin||pin.requireStableRelease!==true||pin.sourceCommit!==lock.engine?.sourceCommit||pin.version!==lock.engine?.version||lock.engine?.repository!==repository)
  throw new Error('Canonical runtime dependency must match engine.lock.json and require a stable release');
 if(!/^[a-f0-9]{40}$/.test(pin.sourceCommit))throw new Error('Engine source pin must be immutable');
 if(production&&/-/.test(pin.version))throw new Error('Production requires a verified stable engine; the pinned engine is a prerelease');
 return {version:pin.version,sourceCommit:pin.sourceCommit,stableRuntime:!/-/.test(pin.version)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const registry=JSON.parse(readFileSync(new URL('../registry/prs.json',import.meta.url),'utf8'));
 const lock=JSON.parse(readFileSync(new URL('../engine.lock.json',import.meta.url),'utf8'));
 const result=verifyDependencyContract(registry,lock,{production:process.argv.includes('--production')});
 console.log('Source dependency contract verified; pinned engine '+result.version+'; stable runtime '+result.stableRuntime+'. Production acceptance remains separate.');
}
