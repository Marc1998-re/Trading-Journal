#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  printf 'Usage: bash tests/start-local-mysql.sh /path/to/mysql-directory /path/to/private-test-directory\n'
  exit 1
fi
binary="$1"
directory="$2"
mkdir -p "$directory"
if [ ! -d "$directory/data/mysql" ]; then
  "$binary/bin/mysqld" --no-defaults --initialize-insecure --basedir="$binary" --datadir="$directory/data"
fi
printf 'Local test database only: 127.0.0.1:33219. Stop with Ctrl+C when tests are finished.\n'
exec "$binary/bin/mysqld" --no-defaults --basedir="$binary" --datadir="$directory/data" --bind-address=127.0.0.1 --port=33219 --socket="$directory/mysql.sock" --pid-file="$directory/mysql.pid" --mysqlx=0 --innodb-buffer-pool-size=128M
