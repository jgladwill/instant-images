import Icon from "./Icon";
import { PluginSidebarMoreMenuItem } from "@wordpress/edit-post";

/**
 * The plugin menu as a component.
 *
 * @return {JSX.Element} The Menu component.
 */
export default function Menu() {
	return (
		<PluginSidebarMoreMenuItem
			icon={<Icon color="unsplash" />}
			target="instant-images-sidebar"
			className="instant-images-menu-item"
		>
			Instant Images
		</PluginSidebarMoreMenuItem>
	);
}
