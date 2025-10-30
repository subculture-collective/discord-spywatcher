#!/bin/sh
# PgBouncer entrypoint script
# This script generates the userlist.txt file from environment variables
# and starts PgBouncer

set -e

# Check if required environment variables are set
if [ -z "$DB_USER" ]; then
  echo "Error: DB_USER environment variable is required"
  exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "Error: DB_PASSWORD environment variable is required"
  exit 1
fi

# Generate md5 hash for the password
# Format: "md5" + md5(password + username)
MD5_HASH=$(echo -n "${DB_PASSWORD}${DB_USER}" | md5sum | awk '{print $1}')
MD5_PASSWORD="md5${MD5_HASH}"

# Create userlist.txt with the hashed password
echo "\"${DB_USER}\" \"${MD5_PASSWORD}\"" > /etc/pgbouncer/userlist.txt

# Add admin user if specified
if [ -n "$PGBOUNCER_ADMIN_USER" ] && [ -n "$PGBOUNCER_ADMIN_PASSWORD" ]; then
  ADMIN_MD5_HASH=$(echo -n "${PGBOUNCER_ADMIN_PASSWORD}${PGBOUNCER_ADMIN_USER}" | md5sum | awk '{print $1}')
  ADMIN_MD5_PASSWORD="md5${ADMIN_MD5_HASH}"
  echo "\"${PGBOUNCER_ADMIN_USER}\" \"${ADMIN_MD5_PASSWORD}\"" >> /etc/pgbouncer/userlist.txt
fi

# Set proper permissions
chmod 600 /etc/pgbouncer/userlist.txt
chmod 644 /etc/pgbouncer/pgbouncer.ini

echo "PgBouncer configuration initialized"
echo "User: ${DB_USER}"
echo "Pool mode: transaction"
echo "Default pool size: 25"
echo "Max client connections: 100"

# Start PgBouncer
exec pgbouncer /etc/pgbouncer/pgbouncer.ini
