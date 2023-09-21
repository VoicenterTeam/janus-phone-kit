import { RouteLocationNormalizedLoaded } from 'vue-router'
import { CONFERENCE_PAGE_QUERY_PARAMETERS } from '@/enum/router.enum'

export function isQueryParameterValid (queryParameter: string | string[]): queryParameter is string {
    return queryParameter && typeof queryParameter === 'string' && queryParameter.length > 0
}

export function generateConferenceQueryParameters (roomId: number, displayName: string) {
    return {
        [CONFERENCE_PAGE_QUERY_PARAMETERS.ROOM_ID]: roomId,
        [CONFERENCE_PAGE_QUERY_PARAMETERS.DISPLAY_NAME]: displayName
    }
}

export function getConferenceQueryParameters (route: RouteLocationNormalizedLoaded): { roomId: number, displayName: string } | undefined {
    const routeQueryParameters = route.query

    const roomId = routeQueryParameters[CONFERENCE_PAGE_QUERY_PARAMETERS.ROOM_ID]
    const displayName = routeQueryParameters[CONFERENCE_PAGE_QUERY_PARAMETERS.DISPLAY_NAME]

    if (!isQueryParameterValid(roomId) || !isQueryParameterValid(displayName)) {
        return undefined
    }

    return {
        roomId: Number(roomId),
        displayName
    }
}
