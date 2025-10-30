FROM alpine:3.19

# Install PgBouncer and dependencies
RUN apk add --no-cache \
    pgbouncer \
    postgresql-client \
    su-exec \
    && rm -rf /var/cache/apk/*

# Create pgbouncer user and directories
RUN addgroup -g 70 -S pgbouncer \
    && adduser -u 70 -S -D -G pgbouncer -H -h /var/lib/pgbouncer -s /sbin/nologin pgbouncer \
    && mkdir -p /etc/pgbouncer /var/log/pgbouncer /var/run/pgbouncer \
    && chown -R pgbouncer:pgbouncer /etc/pgbouncer /var/log/pgbouncer /var/run/pgbouncer

# Copy configuration files
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.txt.template /etc/pgbouncer/userlist.txt.template
COPY entrypoint.sh /entrypoint.sh

# Make entrypoint executable
RUN chmod +x /entrypoint.sh

# Set proper permissions for config files
RUN chown pgbouncer:pgbouncer /etc/pgbouncer/pgbouncer.ini /etc/pgbouncer/userlist.txt.template \
    && chmod 644 /etc/pgbouncer/pgbouncer.ini

# Expose PgBouncer port
EXPOSE 6432

# Health check with proper authentication
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD PGPASSWORD="$DB_PASSWORD" psql -h 127.0.0.1 -p 6432 -U $DB_USER -d pgbouncer -c "SHOW POOLS;" || exit 1

# Run entrypoint script as root to allow chmod, then switch to pgbouncer user within
ENTRYPOINT ["/entrypoint.sh"]
