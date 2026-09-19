import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('two-client world, combat, pickup, host handoff and reconnect', {timeout:20000}, async()=>{
    const port=31000+Math.floor(Math.random()*10000);
    const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
    const sockets=[];
    try {
        await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Server exit ${code}`)));});
        async function client(){const ws=new WebSocket(`ws://127.0.0.1:${port}`);sockets.push(ws);const messages=[];ws.on('message',d=>messages.push(JSON.parse(d)));const wait=async(type,predicate=()=>true)=>{for(let i=0;i<100;i++){const index=messages.findIndex(m=>m.type===type&&predicate(m));if(index>=0)return messages.splice(index,1)[0];await sleep(20);}throw new Error(`Timeout ${type}`);};return {ws,messages,wait,send:m=>ws.send(JSON.stringify(m)),init:await wait('init')};}
        const a=await client(),b=await client();
        assert.deepEqual(a.init.world,b.init.world);assert.equal(a.init.animals.length,12);assert.equal(b.init.animalHost,a.init.playerId);
        const animal={...a.init.animals[0],x:4};
        b.send({type:'animalState',animals:[{...animal,x:20}]});await sleep(80);assert.equal(a.messages.some(m=>m.type==='animalState'),false);
        a.send({type:'animalState',animals:[animal]});assert.equal((await b.wait('animalState')).animals[0].x,4);
        const position={x:animal.x,y:animal.y+1,z:animal.z};
        for(const c of [a,b])c.send({type:'position',position,rotation:{x:0,y:0}});
        await a.wait('playerMoved');await b.wait('playerMoved');
        b.send({type:'playerHit',id:a.init.playerId});assert.equal((await a.wait('damage')).amount,2);await sleep(450);
        for(let i=0;i<3;i++){b.send({type:'animalHit',id:animal.id});await b.wait('animalState');if(i<2)await sleep(450);}
        const drop=(await a.wait('meatDropped')).meat;assert.equal((await b.wait('meatDropped')).meat.id,drop.id);
        a.send({type:'meatPickup',id:drop.id});b.send({type:'meatPickup',id:drop.id});
        const pickup=await a.wait('meatPicked');assert.equal((await b.wait('meatPicked')).playerId,pickup.playerId);
        await sleep(80);assert.equal(a.messages.filter(m=>m.type==='meatPicked').length,0);
        const block={x:4,y:Math.round(position.y),z:8};a.send({type:'blockPlaced',...block,blockType:'wood'});await b.wait('blockPlaced');
        a.ws.close();const handoff=await b.wait('animalHost');assert.equal(handoff.playerId,b.init.playerId);
        b.send({type:'animalState',animals:handoff.animals});
        const c=await client();assert.equal(c.init.animalHost,b.init.playerId);assert.equal(c.init.meat.length,0);assert.ok(c.init.world.some(v=>v.x===block.x&&v.y===block.y&&v.z===block.z&&v.type==='wood'));
        b.send({type:'blockRemoved',...block});await c.wait('blockRemoved');
        const response=await fetch(`http://127.0.0.1:${port}/server.js`);assert.equal(response.status,404);
    } finally {for(const ws of sockets)ws.terminate();server.kill();}
});
