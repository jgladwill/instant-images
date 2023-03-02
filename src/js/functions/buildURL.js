import API from "../constants/API";
import { openverseParams } from "./openverse";

/**
 * Build the API query parameters.
 *
 * @param  {string} type   The query type (search, photos, id).
 * @param  {object} params The current params object.
 * @return {string} 		   The new API URL with querystring params.
 */
export default function buildURL(type, params) {
	if (!type) {
		// Bail early if API query type is missing.
		return "";
	}
	// Get the current provider.
	const { provider = "unsplash" } = params;

	// Provider doesn't need to be sent.
	delete params.provider;

	params = provider === "openverse" ? openverseParams(type, params) : params;

	// Build the API URL.
	const url = new URL(getProxyURL(provider));

	// Add `type` to params.
	url.searchParams.append("type", type);

	// Append query params.
	Object.keys(params).forEach((key) => {
		url.searchParams.append(key, params[key]);
	});

	// Add `version` to params.
	url.searchParams.append("version", instant_img_localize.version);

	return url;
}

/**
 * Get the proxy URL from ENV vars.
 *
 * @param  {string} provider The image provider.
 * @return {string}          The proxy URL.
 */
export function getProxyURL(provider) {
	const { proxy = "https://proxy.getinstantimages.com/api/" } = API;
	return `${proxy}${provider}`;
}
