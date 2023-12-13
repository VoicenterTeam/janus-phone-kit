import { createRouter, createWebHistory } from 'vue-router'
import { scrollBehavior } from '@/router/helpers'

import { RouteRecordRequired } from '@/types/router'

export const HOME_PAGE_ROUTE: RouteRecordRequired = {
    name: 'HomePage',
    component: () => import('@/pages/Home.vue'),
    path: '/'
}
export const CONFERENCE_PAGE_ROUTE: RouteRecordRequired = {
    name: 'ConferencePage',
    component: () => import('@/pages/Conference.vue'),
    path: '/conference',
}
export const ECHOTEST_PAGE_ROUTE: RouteRecordRequired = {
    name: 'EchoTestPage',
    component: () => import('@/pages/EchoTestPage.vue'),
    path: '/echotest',
}

const router = createRouter({
    history: createWebHistory(),
    scrollBehavior,
    routes: [
        HOME_PAGE_ROUTE,
        CONFERENCE_PAGE_ROUTE,
        ECHOTEST_PAGE_ROUTE,
        {
            path: '/:pathMatch(.*)*',
            redirect: '/'
        }
    ]
})

export default router
