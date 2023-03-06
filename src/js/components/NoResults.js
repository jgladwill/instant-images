/**
 * Render the NoResults component.
 *
 * @returns {JSX.Element} The NoResults component.
 */
export default function NoResults() {
	return (
		<div className="no-results">
			<div>
				<h3>{instant_img_localize.no_results} </h3>
				<p>{instant_img_localize.no_results_desc} </p>
			</div>
		</div>
	);
}
