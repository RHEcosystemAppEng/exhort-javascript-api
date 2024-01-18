import {EOL} from "os";
import os from 'os';

export const RegexNotToBeLogged = /EXHORT_.*_TOKEN|ex-.*-token/
/**
 *
 * @param {string} key to log its value from environment variables and from opts, if it exists
 * @param {{}} [opts={}] different options of application, if key in it, log it.
 * @param {string }defValue default value of key in case there is no option and environment variable values for key
 */
export function logValueFromObjects(key,opts, defValue) {
	if(key in opts) {
		console.log(`value of option with key ${key} = ${opts[key]} ${EOL}`)
	}
	else
	{
		console.log(`key ${key} doesn't exists on opts object ${EOL}`)
	}
	if(key in process.env) {
		console.log(`value of environment variable ${key} = ${process.env[key]} ${EOL}`)
	}
	else
	{
		console.log(`environment variable ${key} doesn't exists ${EOL}`)
	}
	console.log(`default value for ${key} = ${defValue} ${EOL}`)
}

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
	if (process.env["EXHORT_DEBUG"] === "true" && !key.match(RegexNotToBeLogged))
	{
		logValueFromObjects(key,opts,def)
	}
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

export function environmentVariableIsPopulated(envVariableName) {
	return envVariableName in process.env && process.env[envVariableName].trim() !== "";
}

/**
 *
 * @param {string} path - path to be checked if contains spaces
 * @return {string} a path with all spaces escaped or manipulated so it will be able to be part
 *                  of commands that will be invoked without errors in os' shell.
 */
export function handleSpacesInPath(path) {
	let transformedPath = path
	// if operating system is windows
	if (os.platform() === "win32") {
		if(hasSpaces(path)) {
			transformedPath = `"${path}"`
		}
	}
	// linux, darwin..
	else {
		if(hasSpaces(path)) {
			transformedPath = path.replaceAll(" ", "\\ ")
		}
	}
	return transformedPath
}

/**
 *
 * @param {string} path the path to check if contains spaces
 * @return {boolean} returns true if path contains spaces
 * @private
 */
function hasSpaces(path) {
	return path.trim().includes(" ")

}
