import { RouteRecordRaw } from 'vue-router'

export type RouteRecordRequired = RouteRecordRaw & {
    name: string
}
