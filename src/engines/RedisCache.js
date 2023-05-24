import {Redis, RedisAPI} from "@vertx/redis-client";

import { CoreUtils } from 'es4x-utils/src/utils/CoreUtils';
import { LogUtils } from 'es4x-utils/src/utils/LogUtils';
import { ObjUtils } from 'es4x-utils/src/utils/ObjUtils';
import { StringUtils } from 'es4x-utils/src/utils/StringUtils';

class	RedisCache
{
	constructor(_vertx, _host)
	{
		this.__redisClient = Redis.createClient(_vertx, _host);
		this.__redis = null;
	}

	async	connect()
	{
		let	connection = await this.__redisClient.connect();
		if (!connection)
		{
			LogUtils.LogError("error connecting to redis");
			return false;
		}

		this.__redis = RedisAPI.api(this.__redisClient);

		return true;
	}

	async	disconnect()
	{
		this.__redisClient.close();
	}

	async	setMulti(_keyValues, _expirationSec = 0)
	{
		if (this.__redis == null)
			return false;

		// prepare the values
		let	params = [];
		for(const key in _keyValues)
		{
			// push the key
			params.push(key);

			// calculate the value and push it
			let	finalValue = CoreUtils.ToString(_keyValues[key]);
			params.push(finalValue);
		}

		// nothing to do?
		if (params.length == 0)
			return true;

		// set the values
		let	ret	= await this.__redis.mset(params);
		if (ret == null)
			return false;

		// with expiration
		if (_expirationSec > 0)
		{
			// set the expire
			for(const key in _keyValues)
			{
				await this.__redis.expire(key, _expirationSec.toString());
			}
		}

		return true;
	}

	async	getMulti(_keys)
	{
		// prepare the return object
		let	ret = {
			"found": {},
			"missing": []
		};

		// no redis? we're missing all the keys
		if (this.__redis == null)
		{
			ret.missing = _keys;
			return ret;
		}

		// do the query
		let	retGet = await this.__redis.mget(_keys);
		if (retGet == null)
		{
			ret.missing = _keys;
			return ret;
		}

		// do each one
		for(let i=0; i<retGet.size(); i++)
		{
			// get the response at that index
			let	response = retGet.get(i);

			// get the value
			let	finalValue = this.getValueFromResponse(response);

			// nothing?
			if (finalValue == null)
				ret.missing.push(_keys[i]);
			else
				ret.found[_keys[i]] = finalValue;
		}

		return ret;
	}

	getValueFromResponse(_response, _default = null)
	{
		if (_response == null)
			return _default;
		
		// get the value
		let	value = _response.toString();

		// convert it
		return StringUtils.ToAny(value, true);			
	}

	async	set(_key, _val, _expirationSec = 0)
	{
		if (this.__redis == null)
			return false;

		// convert the value to STRING
		let	finalValue = CoreUtils.ToString(_val);

		// build the parameters
		let	params = [_key, finalValue];

		// add expiration?
		if (_expirationSec > 0)
		{
			params.push("EX");
			params.push(_expirationSec.toString());
		}

		// set the value
		let	ret = await this.__redis.set(params);

		return ret != null;
	}

	async	get(_key, _default = null)
	{
		if (this.__redis == null)
			return null;

		// get the value
		let	ret = await this.__redis.get(_key);

		// return it
		return this.getValueFromResponse(ret, _default);
	}

	async	delete(_key)
	{
		if (this.__redis == null)
			return false;

		let	ret = this.__redis.del([_key]);

		return ret != null;
	}
}

module.exports = {
    RedisCache: RedisCache
};