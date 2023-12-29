import { createRouter, createWebHistory } from 'vue-router'
import { scrollBehavior } from '@/router/helpers'

import { RouteRecordRequired } from '@/types/router'

export const HOME_PAGE_ROUTE: RouteRecordRequired = {
    name: 'HomePage',
    component: () => import('@/pages/Home.vue'),
    path: '/'
}
export const VIDEO_ROOM_ROUTE: RouteRecordRequired = {
    name: 'VideoRoomDemo',
    component: () => import('@/pages/VideoRoomDemo.vue'),
    path: '/videoroom'
}
export const CONFERENCE_PAGE_ROUTE: RouteRecordRequired = {
    name: 'ConferencePage',
    component: () => import('@/pages/Conference.vue'),
    path: '/conference',
}
export const VIDEO_ROOM_CONFERENCE_PAGE_ROUTE: RouteRecordRequired = {
    name: 'VideoRoomConferencePage',
    component: () => import('@/pages/VideoRoomConference.vue'),
    path: '/video-room-conference',
}

const router = createRouter({
    history: createWebHistory(),
    scrollBehavior,
    routes: [
        HOME_PAGE_ROUTE,
        VIDEO_ROOM_ROUTE,
        CONFERENCE_PAGE_ROUTE,
        VIDEO_ROOM_CONFERENCE_PAGE_ROUTE,
        {
            path: '/:pathMatch(.*)*',
            redirect: '/'
        }
    ]
})

export default router
