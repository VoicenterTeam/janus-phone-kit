export interface MetricConfigType {
  refreshEvery?: number,  // Optional. Refresh every 3 seconds
  startAfter?: number,    // Optional. Start collecting stats after 5 seconds
  stopAfter?: number,     // Optional. Stop collecting stats after 30 seconds
  verbose?: boolean,      // Optional. Display verbose logs or not
  silent?: boolean,       // Optional. No log at all if set to true
}

export type ProbeDirectionType = 'inbound' | 'outbound'

export type ProbeMetricInType = {
  level_in: number
  codec_id_in: string
  codec_in: { mime_type: null | number, clock_rate: null | number, sdp_fmtp_line: null | number }
  delta_jitter_ms_in: number
  percent_packets_lost_in: number
  delta_packets_in: number
  delta_packets_lost_in: number
  total_packets_in: number
  total_packets_lost_in: number
  total_KBytes_in: number
  delta_KBytes_in: number
  delta_kbs_in: number,
  mos_in: number
  mos_emodel_in: number
  ssrc: string
  direction: ProbeDirectionType
}
export type ProbeMetricOutType = {
  level_out: number
  codec_id_out: string
  codec_out: { mime_type: null | number, clock_rate: null | number, sdp_fmtp_line: null | number }
  delta_jitter_ms_out: number
  delta_rtt_ms_out: null | number
  total_rtt_ms_out: number
  total_rtt_measure_out: number
  percent_packets_lost_out: number
  delta_packets_out: number
  delta_packets_lost_out: number
  total_packets_out: number
  total_packets_lost_out: number
  total_KBytes_out: number
  delta_KBytes_out: number
  delta_kbs_out: number
  timestamp_out: null | number
  mos_out: number
  mos_emodel_out: number
  ssrc: string
  direction: ProbeDirectionType
}

export type ProbeMetricType = ProbeMetricInType & ProbeMetricOutType

export interface ProbReportType {
  audio: { [key: string]: ProbeMetricInType | ProbeMetricOutType }
}
