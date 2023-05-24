import { RedisCache } from './engines/RedisCache';

import { LogUtils } from 'es4x-utils/src/utils/LogUtils';
import { ObjUtils } from 'es4x-utils/src/utils/ObjUtils';
import { StringUtils } from 'es4x-utils/src/utils/StringUtils';

class	CacheManager
{
	constructor(_cache)
	{
		this.__cache = _cache;
	}

	async	del(_category, _key)
	{
		// build the key
		let	finalKey = CacheManager.BuildKey(_category, _key);

		return await this.__cache.delete(finalKey);
	}

	async	set(_category, _key, _val, _expirationSec = 0)
	{
		// build the key
		let	finalKey = CacheManager.BuildKey(_category, _key);

		// set it
		return await this.__cache.set(finalKey, _val, _expirationSec);
	}

	async	get(_category, _key, _default = null)
	{
		// build the key
		let	finalKey = CacheManager.BuildKey(_category, _key);

		// get it
		return await this.__cache.get(finalKey, _default);
	}

	async	setMulti(_category, _keyValues, _expirationSec = 0)
	{
		// prepare all the values
		let	allValues = {};
		for(const key in _keyValues)
		{
			// build the final key
			let	finalKey = CacheManager.BuildKey(_category, key);

			// set it
			allValues[finalKey] = _keyValues[key];
		}

		// set them
		return await this.__cache.setMulti(allValues, _expirationSec);
	}

	async	getMulti(_category, _keys)
	{
		// redo all the keys
		let	allKeys = [];
		for(let key of _keys)
			allKeys.push(CacheManager.BuildKey(_category, key));

		// get the values
		let	ret = await this.__cache.getMulti(allKeys);

		// extract the category from the keys
		let	finalRet = {
			"found": {},
			"missing": []
		};
		for(const key in ret.found)
		{
			let	newKey = CacheManager.ExtractKey(key, _category);
			finalRet.found[newKey] = ret.found[key];
		}
		for(const key of ret.missing)
		{
			let	newKey = CacheManager.ExtractKey(key, _category);
			finalRet.missing.push(newKey);
		}
		return finalRet;
	}

	disconnect()
	{
		this.__cache.disconnect();
	}

	static	ExtractKey(_finalKey, _category)
	{
		return _finalKey.replace(_category + ":", "");
	}

	static	BuildKey(_category, _key)
	{
		return _category + ":" + _key;
	}



	static	async	Create(_vertx, _config)
	{
		// is it activated?
		let	isActivated = ObjUtils.GetValueToBool(_config, "redis.activated");
		if (isActivated == false)
			return null;
		
		// get the url
		let	redisUrl = ObjUtils.GetValue(_config, "redis.url", "");
		if (StringUtils.IsEmpty(redisUrl) == true)
		{
			LogUtils.LogError("REDIS: error url is empty");
			return null;
		}

		// create the new Redis cache
		let	redisCache = new RedisCache(_vertx, redisUrl);

		// connect
		let	redisOk = await redisCache.connect();
		if (redisOk == false)
		{
			LogUtils.LogError("REDIS: error connecting to: " + redisUrl);
			return null;
		}

		// create a new cache manager
		let	cacheManager = new CacheManager(redisCache);

		// return it
		return cacheManager;
	}
}

module.exports = {
    CacheManager: CacheManager
};