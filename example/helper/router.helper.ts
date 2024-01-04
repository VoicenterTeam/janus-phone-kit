import { RouteLocationNormalizedLoaded } from 'vue-router'
import { CONFERENCE_PAGE_QUERY_PARAMETERS } from '@/enum/router.enum'
import { JoinRoomData } from '@/types/forms'

export function isQueryParameterValid (queryParameter: string | string[]): queryParameter is string {
    return queryParameter && typeof queryParameter === 'string' && queryParameter.length > 0
}

export function generateConferenceQueryParameters (roomId: string, displayName: string) {
    return {
        [CONFERENCE_PAGE_QUERY_PARAMETERS.ROOM_ID]: roomId,
        [CONFERENCE_PAGE_QUERY_PARAMETERS.DISPLAY_NAME]: displayName
    }
}

export function getConferenceQueryParameters (route: RouteLocationNormalizedLoaded): Partial<JoinRoomData> {
    const routeQueryParameters = route.query

    const paramsData: { roomId: string, displayName: string } = {
        roomId: undefined,
        displayName: undefined
    }

    const roomId = routeQueryParameters[CONFERENCE_PAGE_QUERY_PARAMETERS.ROOM_ID]
      || routeQueryParameters[CONFERENCE_PAGE_QUERY_PARAMETERS.ROOM]
    const displayName = routeQueryParameters[CONFERENCE_PAGE_QUERY_PARAMETERS.DISPLAY_NAME]
      || routeQueryParameters[CONFERENCE_PAGE_QUERY_PARAMETERS.NAME]

    if (isQueryParameterValid(roomId)) {
        paramsData.roomId = roomId
    }

    if (isQueryParameterValid(displayName)) {
        paramsData.displayName = displayName
    }

    return paramsData
}
