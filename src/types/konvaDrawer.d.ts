export type KonvaDrawerOptions = {
    strokeWidth?: number
    strokeColor?: string
    emptyDrawerRectColor?: string
}

export type KonvaDrawerConfig = KonvaDrawerOptions & {
    container: string
    width: number
    height: number
}