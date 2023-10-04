import { JoinRoomData } from '@/types/forms'

export enum ParametersMissingBehaviorType {
    REDIRECT_TO_URL = 'redirectToUrl',
    REQUEST_IF_MISSING = 'requestIfMissing'
}

export interface ParametersMissingRedirectToUrlConfig {
    type: ParametersMissingBehaviorType.REDIRECT_TO_URL,
    data: {
        url: string
    }
}

export interface ParametersMissingRequestIfMissingConfig {
    type: ParametersMissingBehaviorType.REQUEST_IF_MISSING,
    data: {
        fields: Array<keyof JoinRoomData>
    }
}

export type ParametersMissingBehavior = ParametersMissingRedirectToUrlConfig | ParametersMissingRequestIfMissingConfig

export interface ConferencePageQueryParameters {
    PARAMETERS_MISSING_BEHAVIOR: ParametersMissingBehavior
}

export const CONFERENCE_PAGE_QUERY_PARAMETERS: ConferencePageQueryParameters = {
    PARAMETERS_MISSING_BEHAVIOR: {
        type: ParametersMissingBehaviorType.REQUEST_IF_MISSING,
        data: {
            fields: [ 'displayName' ]
        }
    }
}
