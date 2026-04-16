{{/*
Expand the name of the chart.
*/}}
{{- define "mi-clase.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Full name: release + chart name, truncated.
*/}}
{{- define "mi-clase.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "mi-clase.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ include "mi-clase.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "mi-clase.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mi-clase.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
PostgreSQL host.
*/}}
{{- define "mi-clase.postgresqlHost" -}}
{{- if .Values.postgresql.enabled -}}
{{ .Release.Name }}-postgresql
{{- else -}}
{{ required "externalPostgresql.host is required when postgresql.enabled is false" .Values.externalPostgresql.host }}
{{- end -}}
{{- end }}

{{/*
PostgreSQL port.
*/}}
{{- define "mi-clase.postgresqlPort" -}}
{{- if .Values.postgresql.enabled -}}5432{{- else -}}{{ .Values.externalPostgresql.port }}{{- end -}}
{{- end }}

{{/*
PostgreSQL database name.
*/}}
{{- define "mi-clase.postgresqlDatabase" -}}
{{- if .Values.postgresql.enabled -}}{{ .Values.postgresql.auth.database }}{{- else -}}{{ .Values.externalPostgresql.database }}{{- end -}}
{{- end }}

{{/*
PostgreSQL username.
*/}}
{{- define "mi-clase.postgresqlUsername" -}}
{{- if .Values.postgresql.enabled -}}{{ .Values.postgresql.auth.username }}{{- else -}}{{ .Values.externalPostgresql.username }}{{- end -}}
{{- end }}

{{/*
PostgreSQL password.
*/}}
{{- define "mi-clase.postgresqlPassword" -}}
{{- if .Values.postgresql.enabled -}}{{ .Values.postgresql.auth.password }}{{- else -}}{{ .Values.externalPostgresql.password }}{{- end -}}
{{- end }}

{{/*
Redis host.
*/}}
{{- define "mi-clase.redisHost" -}}
{{- if .Values.redis.enabled -}}
{{ .Release.Name }}-redis-master
{{- else -}}
{{ required "externalRedis.host is required when redis.enabled is false" .Values.externalRedis.host }}
{{- end -}}
{{- end }}

{{/*
Redis port.
*/}}
{{- define "mi-clase.redisPort" -}}
{{- if .Values.redis.enabled -}}6379{{- else -}}{{ .Values.externalRedis.port }}{{- end -}}
{{- end }}

{{/*
Redis password.
*/}}
{{- define "mi-clase.redisPassword" -}}
{{- if .Values.redis.enabled -}}{{ .Values.redis.auth.password | default "" }}{{- else -}}{{ .Values.externalRedis.password }}{{- end -}}
{{- end }}

{{/*
MinIO endpoint.
*/}}
{{- define "mi-clase.minioEndpoint" -}}
{{- if .Values.minio.enabled -}}
{{ .Release.Name }}-minio
{{- else -}}
{{ required "externalMinio.host is required when minio.enabled is false" .Values.externalMinio.host }}
{{- end -}}
{{- end }}

{{/*
MinIO port.
*/}}
{{- define "mi-clase.minioPort" -}}
{{- if .Values.minio.enabled -}}9000{{- else -}}{{ .Values.externalMinio.port }}{{- end -}}
{{- end }}

{{/*
MinIO access key.
*/}}
{{- define "mi-clase.minioAccessKey" -}}
{{- if .Values.minio.enabled -}}{{ .Values.minio.rootUser }}{{- else -}}{{ .Values.externalMinio.accessKey }}{{- end -}}
{{- end }}

{{/*
MinIO secret key.
*/}}
{{- define "mi-clase.minioSecretKey" -}}
{{- if .Values.minio.enabled -}}{{ .Values.minio.rootPassword }}{{- else -}}{{ .Values.externalMinio.secretKey }}{{- end -}}
{{- end }}

{{/*
LibreTranslate URL.
*/}}
{{- define "mi-clase.libreTranslateUrl" -}}
{{- if .Values.libretranslate.enabled -}}
http://{{ .Release.Name }}-libretranslate:5000
{{- else -}}
{{ .Values.libretranslate.externalUrl }}
{{- end -}}
{{- end }}
