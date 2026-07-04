{{/* Expand the name of the chart */}}
{{- define "paystream.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/* Create chart label */}}
{{- define "paystream.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}


{{/* Common labels */}}
{{- define "paystream.labels" -}}
helm.sh/chart: {{ include "paystream.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}


{{/* Full image reference */}}
{{- define "paystream.image" -}}
{{- if .Values.global.registry -}}
{{ .Values.global.registry }}/{{ .image }}:{{ .tag }}
{{- else -}}
{{ .image }}:{{ .tag }}
{{- end -}}
{{- end }}
