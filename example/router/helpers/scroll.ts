import { RouterScrollBehavior } from 'vue-router'

export const scrollBehavior: RouterScrollBehavior = (to) => {
    if (to.hash) {
        return { selector: to.hash }
    }
    return { top: 0, behavior: 'smooth', left: 0 }
}
