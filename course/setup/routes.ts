import { defineRoutesSetup } from '@slidev/types'

export default defineRoutesSetup((routes) => {
    console.log("%c Line:4 🥔 routes", "color:#fca650", routes);
    return [
        ...routes,
        // {
        //     path: '/my-page',
        //     component: () => import('../pages/my-page.vue'),
        // },
    ]
})