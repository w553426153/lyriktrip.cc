FROM nginx:1.27-alpine

# Copy templates to a non-default location to avoid nginx's built-in template rendering
# (which would generate both HTTP/HTTPS configs and break first-time bootstrap).
COPY ./templates /opt/nginx-templates
COPY ./docker-entrypoint.d /docker-entrypoint.d

# Remove the default vhost to avoid shadowing our generated config.
RUN rm -f /etc/nginx/conf.d/default.conf
