import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyDependencyContract} from '../scripts/verify-dependency-contract.mjs';
const engine={repository:'neophilism/Secure-Intake-Case-Workflow-Engine',sourceCommit:'a'.repeat(40),version:'1.0.0-rc.9'};
const registry=()=>({units:[{id:'NSI-001',prs:[1],externalDependencies:[{repository:engine.repository,unitId:'SI-42'}]}],runtimeDependencies:[{...engine,requireStableRelease:true}]});
test('accepted local PRs do not remove upstream release requirements',()=>{
 const r=registry();assert.equal(verifyDependencyContract(r,{engine}).stableRuntime,false);
 assert.throws(()=>verifyDependencyContract(r,{engine},{production:true}),/prerelease/);
 r.units[0].externalDependencies=[];assert.throws(()=>verifyDependencyContract(r,{engine}),/upstream/);
});
test('source/version drift cannot pass the dependency contract',()=>{
 assert.throws(()=>verifyDependencyContract(registry(),{engine:{...engine,sourceCommit:'b'.repeat(40)}}),/match/);
 assert.throws(()=>verifyDependencyContract({...registry(),runtimeDependencies:[{...engine,requireStableRelease:false}]},{engine}),/stable/);
});
