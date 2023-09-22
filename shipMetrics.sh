#!/bin/bash
if [ -z "$DATADOG_API_KEY" ]; then
  echo "DATADOG_API_KEY required"
  exit 1
fi

now="$(date +%s)"

js_metrics="$(cat)"

number_of_packages="$(echo $js_metrics | jq -r '.numberOfPackages')"
percent_up_to_date="$(echo $js_metrics | jq -r '.percentUpToDate')"
percent_behind_patch="$(echo $js_metrics | jq -r '.percentBehindPatch')"
percent_behind_minor="$(echo $js_metrics | jq -r '.percentBehindMinor')"
percent_behind_major="$(echo $js_metrics | jq -r '.percentBehindMajor')"

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: $DATADOG_API_KEY" \
  https://api.datadoghq.com/api/v1/series \
  -d @- << EOF
{
  "series": [
    {
      "tags": ["repository:$DATADOG_REPO_NAME"],
      "type": "gauge",
      "metric": "renovate.number_of_packages",
      "points": [
        [
          "$now",
          "$number_of_packages"
        ]
      ]
    },
    {
      "tags": ["repository:$DATADOG_REPO_NAME"],
      "type": "gauge",
      "metric": "renovate.percent_up_to_date",
      "points": [
        [
          "$now",
          "$percent_up_to_date"
        ]
      ]
    },
    {
      "tags": ["repository:$DATADOG_REPO_NAME"],
      "type": "gauge",
      "metric": "renovate.percent_behind_patch",
      "points": [
        [
          "$now",
          "$percent_behind_patch"
        ]
      ]
    },
    {
      "tags": ["repository:$DATADOG_REPO_NAME"],
      "type": "gauge",
      "metric": "renovate.percent_behind_minor",
      "points": [
        [
          "$now",
          "$percent_behind_minor"
        ]
      ]
    },
    {
      "tags": ["repository:$DATADOG_REPO_NAME"],
      "type": "gauge",
      "metric": "renovate.percent_behind_major",
      "points": [
        [
          "$now",
          "$percent_behind_major"
        ]
      ]
    }
  ]
}
EOF

exit 0
