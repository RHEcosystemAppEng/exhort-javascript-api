/**
 * Utility function will return the value for key from the environment variables,
 * if not present will return the value for key from the opts objects only if it's a string,
 * if not present, or not string will return the default value supplied which default to null.
 * @param {string} key the key to look for in the environment variables and the opts object
 * @param {string|null} [def=null] the value to return if nothing else found
 * @param {{}} [opts={}] the options object to look for the key in if not found in environment
 * @returns {string|null} the value of the key found in the environment, options object, or the
 * 		default supplied
 */
export function getCustom(key, def = null, opts = {}) {
	return key in process.env ? process.env[key] : key in opts && typeof opts[key] === 'string' ? opts[key] : def
}

/**
 * Utility function for looking up custom variable for a binary path.
 * Will look in the environment variables (1) or in opts (2) for a key with EXHORT_x_PATH, x is an
 * uppercase version of passed name to look for. The name will also be returned if nothing else was
 * found.
 * @param name the binary name to look for, will be returned as value in nothing else found
 * @param {{}} [opts={}] the options object to look for the key in if not found in environment
 * @returns {string|null} the value of the key found in the environment, options object, or the
 * 		original name supplied
 */
export function getCustomPath(name, opts = {}) {
	return getCustom(`EXHORT_${name.toUpperCase()}_PATH`, name, opts)
}
