module.exports = {
	proxy: PROXY_URL || "https://proxy.getinstantimages.com/api/", // eslint-disable-line
	defaults: {
		provider: "unsplash",
		order: "latest",
		per_page: "20",
		arr_key: "results",
	},
	providers: ["Unsplash", "Openverse", "Pixabay", "Pexels"],
	unsplash: {
		name: "Unsplash",
		requires_key: true,
		new: false,
		api_var: "client_id",
		collections_api: "https://api.unsplash.com/collections/",
	},
	pixabay: {
		name: "Pixabay",
		requires_key: true,
		new: false,
		api_var: "key",
	},
	pexels: {
		name: "Pexels",
		requires_key: true,
		new: false,
		api_var: "key",
		key: "563492ad6f9170000100000120aa91a03d6b495c84870df1be8e1cd8",
	},
	openverse: {
		name: "Openverse",
		requires_key: false,
		new: false,
		api_var: "key",
		key: "",
	},
};
