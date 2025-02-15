import { Fragment, useEffect, useRef, useState } from "@wordpress/element";
import classNames from "classnames";
import Masonry from "masonry-layout";
import { useInView } from "react-intersection-observer";
import API from "../constants/API";
import FILTERS from "../constants/filters";
import buildURL, { buildTestURL } from "../functions/buildURL";
import consoleStatus from "../functions/consoleStatus";
import getQueryParams from "../functions/getQueryParams";
import getResults, { getSearchTotal } from "../functions/getResults";
import { checkRateLimit } from "../functions/helpers";
import APILightbox from "./APILightbox";
import ErrorLightbox from "./ErrorLightbox";
import Filter from "./Filter";
import LoadingBlock from "./LoadingBlock";
import NoResults from "./NoResults";
import ProviderNav from "./ProviderNav";
import RestAPIError from "./RestAPIError";
import Results from "./Results";
import SearchHeader from "./SearchHeader";
import SearchToolTip from "./SearchToolTip";
import Tooltip from "./Tooltip";
const imagesLoaded = require("imagesloaded");
let page = 1;

/**
 * Render the main InstantImages application component.
 *
 * @param {Object} props The component props.
 * @return {JSX.Element} The InstantImages component.
 */
export default function InstantImages(props) {
	let { editor = "classic", data, api_error, provider, container } = props; // eslint-disable-line prefer-const
	const delay = 250;
	const searchClass = "searching";
	const searchDefaults = {
		active: false,
		term: "",
		type: "",
		results: 0,
	};

	// App state.
	const [results, setResults] = useState(getResults(data)); // Image results.
	const [activeProvider, setActiveProvider] = useState(provider); // Current provider
	const [apiTested, setAPITested] = useState([]); // API key test results.
	const [mounted, setMounted] = useState(false); // App mounted state.
	const [loading, setLoading] = useState(true); // Loading state
	const [loadingMore, setLoadingMore] = useState(false); // Load more state.
	const [done, setDone] = useState(false); // Done state.
	const [apiError, setAPIError] = useState(api_error); // API Error.
	const [showAPILightbox, setShowAPILightbox] = useState(false); // Render API key lightbox.
	const [search, setSearch] = useState(searchDefaults);
	const [filterOptions, setFilterOptions] = useState(
		FILTERS[activeProvider].filters
	);
	const [filters, setFilters] = useState({});
	const [searchFilters, setSearchFilters] = useState({});

	// Refs.
	const [loadMoreRef, inView] = useInView({
		rootMargin: "0px 0px",
	});
	const photoListing = useRef();
	const controlNav = useRef();
	const searchInput = useRef();
	const msnry = useRef();

	// WP editor props.
	const blockEditor = editor === "gutenberg" ? true : false;
	const mediaRouter = editor === "media-router" ? true : false;
	const body = document.body;
	const plugin = blockEditor ? body : container.parentNode.parentNode;
	const wrapper = blockEditor
		? body
		: plugin.querySelector(".instant-images-wrapper");

	/**
	 * Get the initial set of photos for the current view (New/Popular/Filters/etc...).
	 *
	 * @since 3.0
	 */
	async function getPhotos() {
		if (loadingMore) {
			return false;
		}

		setLoading(true); // Set loading state.
		clearSearch(); // Clear search results.
		page = 1;

		// Build URL.
		const params = getQueryParams(activeProvider, filters);
		const url = buildURL("photos", params);

		// Create fetch request.
		const response = await fetch(url);
		const { status, headers } = response;
		checkRateLimit(headers);

		// Status OK.
		try {
			const json = await response.json();
			const { error = null } = json; // Get error reporting.
			const images = getResults(json);
			checkTotalResults(images.length);
			setResults(images);
			setAPIError(error);
		} catch (error) {
			consoleStatus(provider, status);
			setLoading(false);
		}

		// Delay loading animatons for effect.
		setTimeout(function () {
			setLoading(false);
		}, delay);
	}

	/**
	 * Load next set of photos in infinite scroll style.
	 *
	 * @since 3.0
	 */
	async function loadMorePhotos() {
		if (!mounted || loading || loadingMore) {
			return;
		}

		setLoadingMore(true);
		page = parseInt(page) + 1;

		// Get search query.
		const searchQuery =
			search?.active && search?.term ? { term: search.term } : {};

		// Build URL.
		const type = search?.active ? "search" : "photos";
		const activeFilters = search?.active ? searchFilters : filters;
		const loadmoreParams = {
			...{ page },
			...searchQuery,
			...activeFilters,
		};
		const params = getQueryParams(activeProvider, loadmoreParams);
		const url = buildURL(type, params);

		// Create fetch request.
		const response = await fetch(url);
		const { status, headers } = response;
		checkRateLimit(headers);

		try {
			const json = await response.json();
			const images = getResults(json);
			checkTotalResults(images.length);
			setResults((prevState) => [...prevState, ...images]);
		} catch (error) {
			consoleStatus(provider, status);
			setLoadingMore(false);
		}
	}

	/**
	 * Perform a photo search.
	 *
	 * @param {string} term Search term.
	 * @since 3.0
	 */
	async function doSearch(term) {
		setLoading(true);
		page = 1; // Reset current page num.

		const searchType = term.substring(0, 3) === "id:" ? "id" : "term";

		// Get search query.
		const searchQuery =
			searchType === "id"
				? { id: term.replace("id:", "").replace(/\s+/, "") }
				: { term };

		// Build URL.
		const searchParams = {
			...{ page },
			...searchQuery,
			...searchFilters,
		};
		const params = getQueryParams(activeProvider, searchParams);
		const url = buildURL("search", params);

		// Create fetch request.
		const response = await fetch(url);
		const { status, headers } = response;
		checkRateLimit(headers);

		try {
			// Get response data.
			const json = await response.json();
			const images = getResults(json);
			checkTotalResults(images.length);
			setResults(images);

			setSearch({
				active: true,
				term,
				type: searchType,
				results: getSearchTotal(json),
			});
		} catch (error) {
			// Reset all search parameters.
			setDone(true);
			setLoading(false);
			consoleStatus(provider, status);
		}
		searchInput.current.classList.remove(searchClass);
	}

	/**
	 * Handle the Photo Search.
	 *
	 * @param {Event} event The dispatched submit event.
	 * @since 3.0
	 */
	function searchHandler(event) {
		event.preventDefault();
		const term = searchInput.current.value;
		if (term.length > 2) {
			searchInput.current.classList.add(searchClass);
			doSearch(term);
		} else {
			searchInput.current.focus();
		}
	}

	/**
	 * Reset search results, settings and results view.
	 *
	 * @since 3.0
	 */
	function clearSearch() {
		searchInput.current.value = "";
		setSearch(searchDefaults);
	}

	/**
	 * Filter the photo listing.
	 *
	 * @param {string} filter The current filter key.
	 * @param {string} value  The value to filter.
	 */
	function filterPhotos(filter, value) {
		const newFilters = { ...filters };
		if (
			(newFilters[filter] && value === "#") ||
			value === "" ||
			value === "all"
		) {
			delete newFilters[filter];
		} else {
			newFilters[filter] = value;
		}
		setFilters({ ...newFilters });
	}

	/**
	 * Filter the search results.
	 *
	 * @param {string} filter The current filter key.
	 * @param {string} value  The value to filter.
	 */
	function filterSearch(filter, value) {
		const newSearchFilters = { ...searchFilters };
		if (
			(newSearchFilters[filter] && value === "#") ||
			value === "" ||
			value === "all"
		) {
			delete newSearchFilters[filter];
		} else {
			newSearchFilters[filter] = value;
		}
		setSearchFilters({ ...newSearchFilters });
	}

	/**
	 * Close the API Lightbox.
	 *
	 * @param {string} target The target provider to close the lightbox for.
	 * @since 4.5
	 */
	function closeAPILightbox(target = null) {
		if (target) {
			setActiveProvider(target);
		}
		setShowAPILightbox(false);
		setLoading(false);
		body.classList.remove("overflow-hidden");
	}

	/**
	 * Switch API providers.
	 *
	 * @param {Event} e The clicked element event.
	 * @since 4.5
	 */
	async function switchProvider(e) {
		const target = e.currentTarget;
		const newProvider = target.dataset.provider;

		if (target.classList.contains("active")) {
			// Exit if already active.
			return;
		}
		setLoading(true);
		setAPIError(false);
		setShowAPILightbox(false);
		body.classList.remove("overflow-hidden");

		// API Verification.
		// Checks for valid API key for provider.
		if (API[newProvider].requires_key && !apiTested.includes(newProvider)) {
			try {
				const response = await fetch(buildTestURL(newProvider));
				const { status, headers } = response;
				checkRateLimit(headers);

				if (status !== 200) {
					// Catch API errors and 401s.
					setShowAPILightbox(newProvider); // Show API Lightbox.
					body.classList.add("overflow-hidden");
					return;
				}
				if (status === 200) {
					// Valid API key - Add to array of tested providers.
					setAPITested((prevState) => [...prevState, newProvider]);
				}
			} catch (error) {
				// Catch all other errors.
				setShowAPILightbox(newProvider); // Show API Lightbox.
				body.classList.add("overflow-hidden");
				return;
			}
		}

		// Update filter options.
		setFilterOptions(FILTERS[newProvider].filters);

		// Switch the provider.
		setActiveProvider(newProvider);
	}

	/**
	 * Renders the Masonry layout.
	 *
	 * @since 3.0
	 */
	function renderLayout() {
		imagesLoaded(photoListing.current, function () {
			if (!blockEditor) {
				msnry.current = new Masonry(photoListing.current, {
					itemSelector: ".photo",
				});
				photoListing.current.querySelectorAll(".photo").forEach((el) => {
					el.classList.add("in-view");
				});
			}
			setTimeout(() => {
				// Delay to allow for rendering and set up.
				setLoading(false);
				setLoadingMore(false);
				if (!mounted) {
					setMounted(true);
				}
			}, delay);
		});
	}

	/**
	 * A checker to determine if there are remaining search results.
	 *
	 * @param {number} num Total search results.
	 * @since 3.0
	 */
	function checkTotalResults(num) {
		setDone(parseInt(num) === 0 || num === undefined);
	}

	/**
	 * Escape handler to close edit windows on photos.
	 *
	 * @param {Event} e The key event.
	 */
	function escFunction(e) {
		const { key } = e;
		if (key === "Escape") {
			const editing = photoListing.current.querySelectorAll(
				".edit-screen.editing"
			);
			if (editing) {
				[...editing].forEach((element) => {
					element?.classList.remove("editing");
				});
			}
		}
	}

	/* Search callback. */
	useEffect(() => {
		if (!search?.active) {
			// Reset search filters when search is false.
			setSearchFilters({});
		}
	}, [search]); // eslint-disable-line react-hooks/exhaustive-deps

	/* Search filters change callback. */
	useEffect(() => {
		if (mounted && search?.active) {
			doSearch(search?.term);
		}
	}, [searchFilters]); // eslint-disable-line react-hooks/exhaustive-deps

	// Filters change callback.
	useEffect(() => {
		if (mounted) {
			getPhotos();
		}
	}, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

	// Provider change callback.
	useEffect(() => {
		setFilters({}); // Trigger filter change.
	}, [activeProvider]); // eslint-disable-line react-hooks/exhaustive-deps

	// Scroll in-view callback.
	useEffect(() => {
		if (!blockEditor && !mediaRouter) {
			// Exclude infinite scroll in media modal and block editor.
			if (mounted && !loading && !done) {
				loadMorePhotos();
			}
		}
	}, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

	// Results callback.
	useEffect(() => {
		renderLayout();
	}, [results]); // eslint-disable-line react-hooks/exhaustive-deps

	// Initial page load.
	useEffect(() => {
		setLoading(false);
		wrapper.classList.add("loaded");
		// Add global escape listener.
		document.addEventListener("keydown", escFunction, false);
		return () => {
			document.removeEventListener("keydown", escFunction, false);
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Fragment>
			<ProviderNav switchProvider={switchProvider} provider={activeProvider} />
			<RestAPIError
				title={instant_img_localize.error_restapi}
				desc={instant_img_localize.error_restapi_desc}
				type="warning"
			/>

			<div className="control-nav" ref={controlNav}>
				<div
					className={classNames(
						"control-nav--filters-wrap",
						apiError || search?.active ? "inactive" : null
					)}
				>
					{filterOptions && Object.entries(filterOptions)?.length ? (
						<div className="control-nav--filters">
							{Object.entries(filterOptions).map(([key, filter], index) => (
								<Filter
									key={`${activeProvider}-${index}-${key}`}
									provider={activeProvider}
									data={filter}
									filterKey={key}
									function={filterPhotos}
								/>
							))}
						</div>
					) : null}
				</div>
				<div
					className={classNames(
						"control-nav--search",
						"search-field",
						apiError ? "inactive" : null
					)}
					id="search-bar"
				>
					<form onSubmit={(e) => searchHandler(e)} autoComplete="off">
						<label htmlFor="search-input" className="offscreen">
							{instant_img_localize.search_label}
						</label>
						<input
							type="search"
							id="search-input"
							placeholder={instant_img_localize.search}
							ref={searchInput}
							disabled={apiError}
						/>
						<button type="submit" disabled={apiError}>
							<i className="fa fa-search"></i>
							<span className="offscreen">{instant_img_localize.search}</span>
						</button>
						<SearchToolTip
							container={plugin}
							getPhotos={getPhotos}
							is_search={search?.active}
							total={search?.results}
							title={`${search?.results} ${instant_img_localize.search_results} ${search?.term}`}
						/>
					</form>
				</div>
			</div>

			<div id="photo-listing" className={loading ? "loading" : null}>
				{!!search?.active && (
					<SearchHeader
						provider={activeProvider}
						term={search?.term}
						total={search?.results}
						filterSearch={filterSearch}
						getPhotos={getPhotos}
					/>
				)}
				<div id="photos" ref={photoListing}>
					<Results
						provider={activeProvider}
						results={results}
						mediaRouter={mediaRouter}
						blockEditor={blockEditor}
					/>
				</div>
				<LoadingBlock loading={loadingMore} total={results?.length} />
				<NoResults total={search?.results} is_search={search?.active} />
				<div className="load-more-wrap" ref={loadMoreRef}>
					<button
						type="button"
						className="button"
						onClick={() => loadMorePhotos()}
					>
						{instant_img_localize.load_more}
					</button>
				</div>
				<APILightbox
					provider={showAPILightbox}
					closeAPILightbox={closeAPILightbox}
				/>
				<ErrorLightbox error={apiError} provider={activeProvider} />
				<Tooltip />
			</div>
		</Fragment>
	);
}
