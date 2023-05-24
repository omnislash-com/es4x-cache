
class	ICacheEngine
{
	constructor()
	{

	}

	async	connect()
	{
		throw new Error("Abstract Method has no implementation");
	}

	async	disconnect()
	{
		throw new Error("Abstract Method has no implementation");
	}

	async	delete(_key)
	{
		throw new Error("Abstract Method has no implementation");
	}

	async	set(_key, _val, _expirationSec = 0)
	{
		throw new Error("Abstract Method has no implementation");
	}

	async	get(_key, _default = null)
	{
		throw new Error("Abstract Method has no implementation");
	}

	async	setMulti(_keyValues, _expirationSec = 0)
	{
		throw new Error("Abstract Method has no implementation");
	}

	async	getMulti(_keys)
	{
		throw new Error("Abstract Method has no implementation");
	}
}

module.exports = {
	ICacheEngine
};