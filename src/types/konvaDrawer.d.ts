export type KonvaDrawerOptions = {
    strokeWidth?: number
    strokeColor?: string
    emptyDrawerRectColor?: string
}

export type KonvaScreenShareDrawerOptions = {
    strokeWidth?: number
    strokeColor?: string
}

export type KonvaDrawerConfig = KonvaDrawerOptions & {
    container: string
    width: number
    height: number
}

export type KonvaScreenShareConfig = KonvaScreenShareDrawerOptions & {
    container: string
    width: number
    height: number
}