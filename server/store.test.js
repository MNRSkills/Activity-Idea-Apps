import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createFavoritesStore} from './store.js';
test('favorites persist, deduplicate and serialize concurrent changes',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'weekends-test-'));
  try {
    const file=path.join(dir,'favorites.json');
    const store=await createFavoritesStore(file);
    await Promise.all([store.set('1',true),store.set('2',true),store.set('1',true)]);
    assert.deepEqual(await store.list(),['1','2']);
    await store.set('1',false);
    assert.deepEqual(await (await createFavoritesStore(file)).list(),['2']);
    assert.deepEqual(JSON.parse(await readFile(file,'utf8')),['2']);
    await writeFile(file,'invalid');
    await assert.rejects(createFavoritesStore(file));
    assert.equal(await readFile(file,'utf8'),'invalid');
  } finally {await rm(dir,{recursive:true,force:true});}
});
