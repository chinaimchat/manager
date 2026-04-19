#!/usr/bin/env sh

set -eu

: "${MANAGER_SERVER_NAME:=localhost}"
export MANAGER_SERVER_NAME
envsubst '${API_URL} ${MANAGER_SERVER_NAME}' < /nginx.conf.template > /etc/nginx/conf.d/default.conf

# 运行时注入「用户端 Web 根地址」，供管理后台「以此用户视角查看」等读取 window.TSDD_CONFIG.CLIENT_WEB_URL
HTML_DIR=/usr/share/nginx/html
INDEX="${HTML_DIR}/index.html"
if [ -n "${CLIENT_WEB_URL:-}" ] && [ -f "${INDEX}" ] && [ -f /tsdd-config.js.template ]; then
  export CLIENT_WEB_URL
  envsubst '${CLIENT_WEB_URL}' < /tsdd-config.js.template > "${HTML_DIR}/tsdd-config.js"
  if ! grep -q 'tsdd-config.js' "${INDEX}"; then
    sed -i "s#</head>#<script src=\"/tsdd-config.js\"></script></head>#" "${INDEX}" || true
  fi
fi

exec "$@"