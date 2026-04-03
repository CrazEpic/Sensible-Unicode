// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ["@nuxt/ui"],
	devtools: { enabled: true },
	css: ["~/assets/css/main.css"],
	vite: {
		optimizeDeps: {
			include: ["@vue/devtools-core", "@vue/devtools-kit"],
		},
	},
})
