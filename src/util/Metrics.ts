// @ts-nocheck

import WebRTCMetrics from 'webrtcmetrics'
import {
    MetricConfigType,
    ProbReportType,
    ProbeMetricInType,
    ProbeMetricOutType,
    ProbeDirectionType,
    ProbeMetricType
} from '../types/metrics'


const DEFAULT_CONFIG: MetricConfigType = {
    refreshEvery: 1000,   // Optional. Refresh every 1 second
}

export class Metrics {
    private metrics: any | null = null
    private probe: any | null = null
    public data: ProbeMetricType | null = null

    constructor (configuration: MetricConfigType = {}) {
        const config = {
            ...DEFAULT_CONFIG,
            configuration
        }
        this.metrics = new WebRTCMetrics(config)
    }

    public start (connection: RTCPeerConnection) {
        this.probe = this.metrics.createProbe(connection, {
            cid: this.generateUniqueID()
        })

        this.metrics.startAllProbes()
    }

    public stop () {
        this.metrics.stopAllProbes()
    }

    public onReport (direction: ProbeDirectionType ,cb) {
        const inboundKeys: Array<string> = []
        let inboundAudio: string

        this.probe.onreport = (report: ProbReportType) => {
            Object.entries(report.audio).forEach(([ key, value ]) => {
                if (value.direction === direction && !inboundKeys.includes(key)) {
                    inboundKeys.push(key)
                    inboundAudio = key
                }
            })

            const inboundAudioMetric = report.audio[inboundAudio] as ProbeMetricInType | ProbeMetricOutType

            if (inboundAudioMetric) {
                cb(inboundAudioMetric)
            }
        }
    }

    private generateUniqueID () {
        return 'peer-' + Math.random().toString(36).substr(2, 9)
    }
}
