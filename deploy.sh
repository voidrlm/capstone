#!/usr/bin/env bash
# MediRisk 3-Instance AWS EC2 Deployment Script
# Provisions completely separate instances for Frontend, Backend, and Database.

set -euo pipefail

# Add AWS CLI to PATH if needed
export PATH="$PATH:/c/Program Files/Amazon/AWSCLIV2"

PREFIX="medirisk"
KEY_NAME="${PREFIX}-key"
SG_NAME="${PREFIX}-sg"
INSTANCE_TYPE="t3.small"
REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_FILE="$SCRIPT_DIR/$KEY_NAME.pem"

echo "=== MediRisk Distributed AWS Deployment ==="

echo "Select deployment target:"
echo "  1) Frontend"
echo "  2) Backend"
echo "  3) Both"
read -r -p "Enter option [1-3]: " DEPLOY_CHOICE

case "$DEPLOY_CHOICE" in
  1)
    DEPLOY_FRONTEND=true
    DEPLOY_BACKEND=false
    DEPLOY_DATABASE=false
    ;;
  2)
    DEPLOY_FRONTEND=false
    DEPLOY_BACKEND=true
    DEPLOY_DATABASE=true
    ;;
  3)
    DEPLOY_FRONTEND=true
    DEPLOY_BACKEND=true
    DEPLOY_DATABASE=true
    ;;
  *)
    echo "Invalid option. Please enter 1, 2, or 3." >&2
    exit 1
    ;;
esac

# 1. KEY PAIR
if [ ! -s "$KEY_FILE" ]; then
  echo "Creating key pair..."
  # Delete existing key pair on AWS if the local file doesn't exist or is empty, to prevent Duplicate errors
  aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$REGION" >/dev/null 2>&1 || true
  
  aws ec2 create-key-pair \
    --key-name "$KEY_NAME" \
    --region "$REGION" \
    --query 'KeyMaterial' \
    --output text > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
fi

# 2. SECURITY GROUPS
echo "Configuring Security Group..."
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" --region "$REGION" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")

if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ] || [ "$SG_ID" = "null" ]; then
  SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "MediRisk Distributed Cluster Security Group" \
    --region "$REGION" \
    --query 'GroupId' \
    --output text)

  # Full ingress for simplicity (SSH, HTTP ports, DB ports)
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --region "$REGION" \
    --ip-permissions \
    '[
      {"IpProtocol":"tcp","FromPort":22,"ToPort":22,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
      {"IpProtocol":"tcp","FromPort":80,"ToPort":80,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
      {"IpProtocol":"tcp","FromPort":8080,"ToPort":8080,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
      {"IpProtocol":"tcp","FromPort":3000,"ToPort":3000,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]},
      {"IpProtocol":"tcp","FromPort":5432,"ToPort":5432,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]}
    ]' > /dev/null
fi

ensure_ingress_rule() {
  local port=$1

  if ! aws ec2 describe-security-groups \
    --group-ids "$SG_ID" \
    --region "$REGION" \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`$port\` && ToPort==\`$port\` && IpProtocol==\`tcp\`]" \
    --output text | grep -q .; then
    aws ec2 authorize-security-group-ingress \
      --group-id "$SG_ID" \
      --region "$REGION" \
      --protocol tcp \
      --port "$port" \
      --cidr 0.0.0.0/0 >/dev/null
  fi
}

ensure_ingress_rule 22
ensure_ingress_rule 80
ensure_ingress_rule 3000
ensure_ingress_rule 5432

# 3. HARDCODED INSTANCES
DB_ID="i-0524f6f5e3b2c876b"   # medirisk-database
BE_ID="i-0e778ab7f3135455b"   # medirisk-backend
FE_ID="i-0a1fae826dc08b229"   # medirisk-frontend

echo "Ensuring instances are running..."
aws ec2 start-instances --instance-ids "$DB_ID" "$BE_ID" "$FE_ID" --region "$REGION" >/dev/null 2>&1 || true

echo "Waiting for all instances to be running..."
aws ec2 wait instance-running --instance-ids "$DB_ID" "$BE_ID" "$FE_ID" --region "$REGION"

# 5. GET IPs
get_ip() {
  aws ec2 describe-instances --instance-ids "$1" --region "$REGION" \
    --query "Reservations[0].Instances[0].$2" --output text
}

DB_PRIV=$(get_ip "$DB_ID" "PrivateIpAddress")
DB_PUB=$(get_ip "$DB_ID" "PublicIpAddress")
BE_PRIV=$(get_ip "$BE_ID" "PrivateIpAddress")
BE_PUB=$(get_ip "$BE_ID" "PublicIpAddress")
FE_PUB=$(get_ip "$FE_ID" "PublicIpAddress")

echo "=========================================="
echo "DB Instance:       $DB_PUB (Private: $DB_PRIV)"
echo "Backend Instance:  $BE_PUB (Private: $BE_PRIV)"
echo "Frontend Instance: $FE_PUB"
echo "=========================================="

echo "Waiting for EC2 bootstrap to finish (~40s)..."
sleep 40

JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32 2>/dev/null || tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 32)}"
BACKEND_URL="http://$BE_PUB:3000"
FRONTEND_URL="http://$FE_PUB"

sync_project_to_host() {
  local host=$1
  local remote_dir=$2

  tar \
    --exclude='.git' \
    --exclude='.claude' \
    --exclude='backend/node_modules' \
    --exclude='frontend/node_modules' \
    --exclude='frontend/dist' \
    --exclude='backend/dist' \
    --exclude='*.pem' \
    -czf - \
    -C "$SCRIPT_DIR" . \
  | ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$host" \
      "mkdir -p '$remote_dir' && tar -xzf - -C '$remote_dir'"
}


# ================= DATABASE SETUP =================
if [ "$DEPLOY_DATABASE" = true ]; then
echo "Deploying Database..."
ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' -o 'ConnectTimeout=10' ec2-user@"$DB_PUB" << EOF
  set -euo pipefail
  # Only ensure the Postgres container is running; do not redeploy DB contents.
  sudo dnf install -y docker || true
  sudo systemctl start docker || true
  sudo systemctl enable docker || true
  POSTGRES_CONTAINER=\$(sudo docker ps -a --format '{{.Names}} {{.Image}}' | awk '\$2 ~ /^postgres(:|@|$)/ {print \$1; exit}')
  if [ -n "\$POSTGRES_CONTAINER" ]; then
    if ! sudo docker ps --format '{{.Names}}' | grep -qx "\$POSTGRES_CONTAINER"; then
      sudo docker start "\$POSTGRES_CONTAINER"
    fi
  elif [ -f /home/ec2-user/docker-compose.yml ]; then
    cd /home/ec2-user
    sudo docker-compose up -d
  elif [ -f /home/ec2-user/compose.yml ] || [ -f /home/ec2-user/compose.yaml ]; then
    cd /home/ec2-user
    sudo docker compose up -d
  else
    echo "No existing Postgres container or compose file was found on the DB instance." >&2
    exit 1
  fi
  if ! sudo docker ps --format '{{.Image}}' | grep -q '^postgres'; then
    if [ -n "\$POSTGRES_CONTAINER" ]; then
      echo "Postgres container '\$POSTGRES_CONTAINER' is not running after restart attempt." >&2
    else
      echo "Postgres service did not come up on the DB instance." >&2
    fi
    exit 1
  fi
EOF

POSTGRES_CONTAINER=$(ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' -o 'ConnectTimeout=10' ec2-user@"$DB_PUB" \
  "sudo docker ps -a --format '{{.Names}} {{.Image}}' | awk '\$2 ~ /^postgres(:|@|$)/ {print \$1; exit}'")

if [ -z "$POSTGRES_CONTAINER" ]; then
  echo "Unable to determine the Postgres container name on the DB instance." >&2
  exit 1
fi

SCHEMA_EXISTS=$(ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' -o 'ConnectTimeout=10' ec2-user@"$DB_PUB" \
  "sudo docker exec \"$POSTGRES_CONTAINER\" psql -U postgres -d medirisk -tAc \"SELECT to_regclass('public.users');\"" \
  | tr -d '[:space:]')

if [ "$SCHEMA_EXISTS" != "users" ]; then
  echo "Initializing database schema..."
  ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' -o 'ConnectTimeout=10' ec2-user@"$DB_PUB" \
    "sudo docker exec -i \"$POSTGRES_CONTAINER\" psql -U postgres -d medirisk" < "$SCRIPT_DIR/backend/src/db/init.sql"
fi

PATIENT_ORG_TABLE_EXISTS=$(ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' -o 'ConnectTimeout=10' ec2-user@"$DB_PUB" \
  "sudo docker exec \"$POSTGRES_CONTAINER\" psql -U postgres -d medirisk -tAc \"SELECT to_regclass('public.patient_organizations');\"" \
  | tr -d '[:space:]')

if [ "$PATIENT_ORG_TABLE_EXISTS" != "patient_organizations" ]; then
  echo "Applying patient organization schema migration..."
  ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' -o 'ConnectTimeout=10' ec2-user@"$DB_PUB" \
    "sudo docker exec -i \"$POSTGRES_CONTAINER\" psql -U postgres -d medirisk" < "$SCRIPT_DIR/backend/scripts/ensurePatientOrganizations.sql"
fi
fi

# ================= BACKEND SETUP =================
if [ "$DEPLOY_BACKEND" = true ]; then
echo "Deploying Backend..."
# Ensure runtime dependencies exist and prepare target directory
ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$BE_PUB" 'sudo dnf install -y docker || true; sudo systemctl start docker || true; sudo systemctl enable docker || true; mkdir -p /home/ec2-user/medirisk'

echo "Syncing code to Backend Instance..."
sync_project_to_host "$BE_PUB" "/home/ec2-user/medirisk"

ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$BE_PUB" << EOF
  set -euo pipefail
  cat > /home/ec2-user/medirisk/backend/.env << 'ENV'
PORT=3000
NODE_ENV=production
DB_HOST=$DB_PRIV
DB_PORT=5432
DB_NAME=medirisk
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=1d
CORS_ORIGIN=$FRONTEND_URL
FRONTEND_URL=$FRONTEND_URL
ENV
  cd medirisk
  sudo docker rm -f backend 2>/dev/null || true
  sudo docker build -t backend .
  sudo docker run -d --name backend -p 3000:3000 --env-file backend/.env backend
  sudo docker image prune -f >/dev/null 2>&1 || true
  sudo docker container prune -f >/dev/null 2>&1 || true
EOF
fi

# ================= FRONTEND SETUP =================
if [ "$DEPLOY_FRONTEND" = true ]; then
echo "Deploying Frontend..."
# Ensure Node/npm are available at a compatible version and prepare target directory
ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$FE_PUB" "bash -lc '
  set -euo pipefail
  if ! command -v node >/dev/null 2>&1 || ! node -e \"process.exit(Number(process.versions.node.split(\\\".\\\")[0]) >= 20 ? 0 : 1)\"; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo dnf remove -y nodejs nodejs-npm || true
    sudo dnf install -y nodejs
    hash -r
  fi
  node -v
  npm -v
  if ! node -e \"process.exit(Number(process.versions.node.split(\\\".\\\")[0]) >= 20 ? 0 : 1)\"; then
    echo \"Frontend instance is still using an unsupported Node.js version.\" >&2
    exit 1
  fi
  mkdir -p /home/ec2-user/medirisk
'"

echo "Syncing code to Frontend Instance..."
sync_project_to_host "$FE_PUB" "/home/ec2-user/medirisk"

ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$FE_PUB" << EOF
  set -euo pipefail
  cd /home/ec2-user/medirisk/frontend
  sudo pm2 delete frontend >/dev/null 2>&1 || true
  sudo pm2 flush >/dev/null 2>&1 || true
  rm -rf node_modules dist
  npm cache clean --force >/dev/null 2>&1 || true
  npm install
  export VITE_API_URL=$BACKEND_URL
  npm run build
  sudo npm install -g pm2
  sudo pm2 serve dist 80 --name "frontend" --spa
EOF
fi

echo ""
echo "=========================================="
echo " Architecture Deployed Successfully!      "
echo "=========================================="
echo " - Frontend URL: $FRONTEND_URL"
echo " - Backend URL:  $BACKEND_URL"
echo " - DB Internal:  $DB_PRIV:5432"
