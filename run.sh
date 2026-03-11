#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# run.sh  —  Start / stop / rebuild the MediRisk stack via Docker
# Usage:
#   ./run.sh            # build images & start all services
#   ./run.sh start      # same as above
#   ./run.sh stop       # stop & remove containers
#   ./run.sh restart    # stop then start
#   ./run.sh rebuild    # force-rebuild images then start
#   ./run.sh logs       # tail logs from all containers
#   ./run.sh status     # show container status
# ──────────────────────────────────────────────────────────────

set -euo pipefail

COMPOSE="docker compose"

# Colours
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Colour

info()    { echo -e "${CYAN}[run.sh]${NC} $*"; }
success() { echo -e "${GREEN}[run.sh]${NC} $*"; }
error()   { echo -e "${RED}[run.sh] ERROR:${NC} $*" >&2; exit 1; }

# Ensure Docker is running
docker info > /dev/null 2>&1 || error "Docker daemon is not running. Please start Docker first."

CMD="${1:-start}"

case "$CMD" in
  start)
    info "Building images and starting all services..."
    $COMPOSE up --build -d
    success "Stack is up!"
    echo ""
    echo "  🌐  Frontend  →  http://localhost"
    echo "  🔧  Backend   →  http://localhost:3000"
    echo "  🗄️  Postgres  →  localhost:5433"
    echo ""
    info "Run './run.sh logs' to tail logs, './run.sh stop' to shut down."
    ;;

  stop)
    info "Stopping and removing containers..."
    $COMPOSE down
    success "Stack stopped."
    ;;

  restart)
    info "Restarting stack..."
    $COMPOSE down
    $COMPOSE up --build -d
    success "Stack restarted."
    ;;

  rebuild)
    info "Force-rebuilding all images (no cache)..."
    $COMPOSE down
    $COMPOSE build --no-cache
    $COMPOSE up -d
    success "Stack rebuilt and started."
    ;;

  logs)
    info "Tailing logs (Ctrl-C to exit)..."
    $COMPOSE logs -f
    ;;

  status)
    $COMPOSE ps
    ;;

  *)
    error "Unknown command '$CMD'. Valid commands: start | stop | restart | rebuild | logs | status"
    ;;
esac
