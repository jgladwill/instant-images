import { useEffect, useState } from "@wordpress/element";
import InstantImages from "../../../components/InstantImages";
import buildURL from "../../../functions/buildURL";
import consoleStatus from "../../../functions/consoleStatus";
import getProvider from "../../../functions/getProvider";
import getQueryParams from "../../../functions/getQueryParams";
import { checkRateLimit } from "../../../functions/helpers";

/**
 * The image listing panel for the plugin sidebar.
 *
 * @return {JSX.Element} The Panel component.
 */
export default function Panel() {
	const [data, setData] = useState({});

	// Get provider and options from settings.
	const provider = getProvider();

	useEffect(() => {
		/**
		 * Fetch the initial provider results.
		 * Note: We must wrap our fetch call in an async await wrapper and then pass the provider
		 * as state. Otherwise React throws a 'Objects are not valid as a React child' error.
		 */
		async function initialize() {
			// Build URL.
			const params = getQueryParams(provider);
			const url = buildURL("photos", params);

			// Create fetch request.
			const response = await fetch(url);
			const { status, headers } = response;
			checkRateLimit(headers);

			try {
				// Get response data.
				const results = await response.json();
				const { error = null } = results;

				// Set results to state.
				setData({ results, error });
			} catch (error) {
				consoleStatus(provider, status);
			}
		}
		initialize();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="instant-img-container">
			{data && data.results ? (
				<InstantImages
					editor="gutenberg"
					data={data.results}
					api_error={data.error}
					provider={provider}
				/>
			) : null}
		</div>
	);
}
