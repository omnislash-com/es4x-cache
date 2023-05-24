/// <reference types="@vertx/core" />
// @ts-check
import { TestSuite } from '@vertx/unit';
import { ObjUtils } from 'es4x-utils/src/utils/ObjUtils';

import { CacheManager } from '../src/CacheManager';
const	config = require('./test_config.json');

const suite = TestSuite.create("ES4X Test: Redis");


// Redis
suite.test("Redis.Connection", async function (context) {

	let async = context.async();

	try
	{
		// create the cache and connect
		let	category = ObjUtils.GetValueToString(config, "redis.category_name");
		let	hostUrl = ObjUtils.GetValueToString(config, "redis.url");
		let	cache = await CacheManager.Create(vertx, hostUrl);

		// connect
		if (cache == null)
		{
			console.error("REDIS Error CONNECTION");
			context.assertNotNull(cache);
			async.complete();
			return;
		}

		// TEST1: set / get
		// - set value
		let	test1Key = "test1";
		let	test1Value = "mytestvalue";
		let	test1Exp = 0;
		let	set1Ok = await cache.set(category, test1Key, test1Value, test1Exp);
		if (set1Ok == false)
		{
			console.error("REDIS Error SET 1");
			context.assertEquals(set1Ok, true);
			async.complete();
			return;
		}

		// - get value
		let	get1Ret = await cache.get(category, test1Key);	
		if (get1Ret != test1Value)
		{
			console.error("REDIS Error GET 1");
			context.assertEquals(get1Ret, test1Value);
			async.complete();
			return;
		}


		// TEST2: set / get with expiration
		// - set value
		let	test2Key = "test2";
		let	test2Value = "mytestvaluewith expiration";
		let	test2Exp = 60;
		let	set2Ok = await cache.set(category, test2Key, test2Value, test2Exp);
		if (set2Ok == false)
		{
			console.error("REDIS Error SET 2");
			context.assertEquals(set2Ok, true);
			async.complete();
			return;
		}

		// - get value
		let	get2Ret = await cache.get(category, test2Key);	
		if (get2Ret != test2Value)
		{
			console.error("REDIS Error GET 2");
			context.assertEquals(get2Ret, test2Value);
			async.complete();
			return;
		}


		// TEST3: set / get JSON
		// - set value
		let	test3Key = "test3";
		let	test3Value = {
			"key1": "value1",
			"key2": 10,
			"key3": {
				"array1": [
					1,
					2,
					3,
					{
						"key4": "value4"
					}
				]
			}
		};
		let	test3Exp = 0;
		let	set3Ok = await cache.set(category, test3Key, test3Value, test3Exp);
		if (set3Ok == false)
		{
			console.error("REDIS Error SET 3");
			context.assertEquals(set3Ok, true);
			async.complete();
			return;
		}

		// - get value
		let	get3Ret = await cache.get(category, test3Key);	
		if (get3Ret == null)
		{
			console.error("REDIS Error GET 2");
			context.assertNotNull(get3Ret);
			async.complete();
			return;
		}

		context.assertEquals(ObjUtils.GetValue(get3Ret, "key1"), test3Value.key1);
		context.assertEquals(ObjUtils.GetValue(get3Ret, "key2"), test3Value.key2);
		context.assertEquals(ObjUtils.GetValue(get3Ret, "key3.array1[0]"), test3Value.key3.array1[0]);
		context.assertEquals(ObjUtils.GetValue(get3Ret, "key3.array1[1]"), test3Value.key3.array1[1]);
		context.assertEquals(ObjUtils.GetValue(get3Ret, "key3.array1[2]"), test3Value.key3.array1[2]);
		context.assertEquals(ObjUtils.GetValue(get3Ret, "key3.array1[3].key4"), test3Value.key3.array1[3]["key4"]);


		// TEST4: set / get multi
		let	keyValuesTest4 = {
			"multi1": "myvalue",
			"multi2": 10,
			"multi3": {
				"key1": "value1",
				"key2": "value2"
			}
		};
		let	test4Exp = 0;
		let	set4Ok = await cache.setMulti(category, keyValuesTest4, test4Exp);
		if (set4Ok == false)
		{
			console.error("REDIS Error SET 4");
			context.assertEquals(set4Ok, true);
			async.complete();
			return;
		}

		// - get multi
		let	keysToGet4 = ["multi1", "multi2", "multi3", "multi4", "multi5"];
		let	getMulti4 = await cache.getMulti(category, keysToGet4);
		if (getMulti4 == null)
		{
			console.error("REDIS Error GET 4");
			context.assertNotNull(getMulti4);
			async.complete();
			return;
		}
		context.assertEquals(ObjUtils.GetValue(getMulti4, "found.multi1"), keyValuesTest4.multi1);
		context.assertEquals(ObjUtils.GetValue(getMulti4, "found.multi2"), keyValuesTest4.multi2);
		context.assertEquals(ObjUtils.GetValue(getMulti4, "found.multi3.key1"), keyValuesTest4.multi3.key1);
		context.assertEquals(ObjUtils.GetValue(getMulti4, "found.multi3.key2"), keyValuesTest4.multi3.key2);
		context.assertEquals(ObjUtils.GetValue(getMulti4, "missing[0]"), "multi4");
		context.assertEquals(ObjUtils.GetValue(getMulti4, "missing[1]"), "multi5");

		// TEST5: set / get multi
		let	keyValuesTest5 = {
			"multiexp1": "myvalue",
			"multiexp2": 10,
			"multiexp3": {
				"key1": "value1",
				"key2": "value2"
			}
		};
		let	test5Exp = 120;
		let	set5Ok = await cache.setMulti(category, keyValuesTest5, test5Exp);
		if (set5Ok == false)
		{
			console.error("REDIS Error SET 5");
			context.assertEquals(set5Ok, true);
			async.complete();
			return;
		}

		// delete one
		await cache.del(category, "multiexp2");

		// - get multi
		let	keysToGet5 = ["multiexp1", "multiexp2", "multiexp3", "multiexp4", "multiexp5"];
		let	getMulti5 = await cache.getMulti(category, keysToGet5);
		if (getMulti5 == null)
		{
			console.error("REDIS Error GET 5");
			context.assertNotNull(getMulti5);
			async.complete();
			return;
		}
		context.assertEquals(ObjUtils.GetValue(getMulti5, "found.multiexp1"), keyValuesTest4.multi1);
		context.assertEquals(ObjUtils.GetValue(getMulti5, "found.multiexp3.key1"), keyValuesTest4.multi3.key1);
		context.assertEquals(ObjUtils.GetValue(getMulti5, "found.multiexp3.key2"), keyValuesTest4.multi3.key2);
		context.assertEquals(ObjUtils.GetValue(getMulti5, "missing[0]"), "multiexp2");
		context.assertEquals(ObjUtils.GetValue(getMulti5, "missing[1]"), "multiexp4");
		context.assertEquals(ObjUtils.GetValue(getMulti5, "missing[2]"), "multiexp5");

		// disconnect
		cache.disconnect();
		async.complete();
	}
	catch(e)
	{
		console.trace(e);
		async.complete();
	}
});

suite.run();
