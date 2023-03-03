const { dispatch } = wp.data;

/**
 * Set image as featured image in Gutenberg.
 *
 * @param {string} imageId The attachment ID.
 */
const SetFeaturedImage = (imageId) => {
	if (imageId === null) {
		return false;
	}
	dispatch("core/editor").editPost({ featured_media: imageId });
};
export default SetFeaturedImage;
