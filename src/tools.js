/**
 * Utility function will return the value for key from the environment variables,
 * if not present will return the value for key from the opts objects only if it's a string,
 * if not present, or not string will return the default value supplied which default to null.
 * @param {string} key the key to look for in the environment variables and the opts object
 * @param {string|null} [def=null] the value to return if nothing else found
 * @param {any} [opts={}] the options object to look for the key in if not found in environment
 * @returns {string|null} the value of the key found in the environment, options package, or the default supplied
 */
export function getCustom(key, def = null, opts = {}) {
	return key in process.env ? process.env[key] : key in opts && typeof opts[key] === 'string' ? opts[key] : def
}
