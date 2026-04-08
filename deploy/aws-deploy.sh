#!/usr/bin/env bash
# MediRisk AWS EC2 Deployment Script
# Usage:
#   bash deploy/aws-deploy.sh            # redeploy to existing instance, or provision a new one if none exists
#   bash deploy/aws-deploy.sh redeploy   # pull latest code & rebuild on existing instance (same as default)
#   bash deploy/aws-deploy.sh provision  # force-provision a brand new EC2 instance
#   bash deploy/aws-deploy.sh ssh        # open an SSH shell to the existing instance
#   bash deploy/aws-deploy.sh logs       # tail docker compose logs on the instance
set -euo pipefail

# Add AWS CLI to PATH if needed
export PATH="$PATH:/c/Program Files/Amazon/AWSCLIV2"

KEY_NAME="medirisk-key"
SG_NAME="medirisk-sg"
INSTANCE_TYPE="t3.small"
REGION="${AWS_REGION:-us-east-1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_FILE="$SCRIPT_DIR/$KEY_NAME.pem"

CMD="${1:-deploy}"

# Default "deploy" — redeploy if instance exists, otherwise provision
if [ "$CMD" = "deploy" ]; then
  if [ -s "$SCRIPT_DIR/instance-info.txt" ]; then
    CMD="redeploy"
  else
    CMD="provision"
  fi
fi

# ── redeploy / ssh / logs — operate on the existing instance ─────────────────
if [[ "$CMD" == "redeploy" || "$CMD" == "ssh" || "$CMD" == "logs" ]]; then
  if [ ! -s "$SCRIPT_DIR/instance-info.txt" ]; then
    echo "ERROR: deploy/instance-info.txt not found or empty. Run 'bash deploy/aws-deploy.sh provision' first." >&2
    exit 1
  fi
  source "$SCRIPT_DIR/instance-info.txt"

  case "$CMD" in
    redeploy)
      echo "=== MediRisk Redeploy ==="
      echo "Instance: $INSTANCE_ID  ($PUBLIC_IP)"

      # Regenerate .env.production with the stored IP (preserves JWT secret if present)
      if [ -f "$SCRIPT_DIR/.env.production" ]; then
        echo "[1/2] Reusing existing deploy/.env.production"
      else
        echo "[1/2] Generating production .env..."
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 32)
        cat > "$SCRIPT_DIR/.env.production" << EOF
PORT=3000
NODE_ENV=production

DB_HOST=postgres
DB_PORT=5432
DB_NAME=medirisk
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=1d

CORS_ORIGIN=http://$PUBLIC_IP
FRONTEND_PORT=80
VITE_API_URL=http://$PUBLIC_IP

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
      fi

      echo "[2/2] Pulling latest code and rebuilding on EC2..."
      scp -i "$KEY_FILE" -o StrictHostKeyChecking=no \
        "$SCRIPT_DIR/.env.production" ec2-user@"$PUBLIC_IP":/home/ec2-user/medirisk/.env

      ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP" << 'ENDSSH'
# Ensure instance has swap space, otherwise npm install and vite build fail on t3.small 2GB RAM.
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap space to prevent memory crashes during build..."
    sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
fi

cd /home/ec2-user/medirisk
git pull
# Clean up docker caches to prevent ENOSPC out of space errors on EC2
docker system prune -af --volumes || true
docker builder prune -af || true
docker compose build --no-cache frontend
docker compose up -d
echo "Redeploy complete."
ENDSSH

      echo ""
      echo "=========================================="
      echo " Redeploy complete!"
      echo " App URL:  http://$PUBLIC_IP"
      echo "=========================================="
      ;;

    ssh)
      exec ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP"
      ;;

    logs)
      ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP" \
        "cd /home/ec2-user/medirisk && docker compose logs -f"
      ;;
  esac
  exit 0
fi

echo "=== MediRisk AWS Deployment (Provisioning New Instance) ==="
echo "Region: $REGION"

# ── 1. Key pair ──────────────────────────────────────────────────────────────
if [ -f "$KEY_FILE" ]; then
  echo "[1/7] Key pair file already exists, skipping creation."
else
  echo "[1/7] Creating key pair..."
  aws ec2 create-key-pair \
    --key-name "$KEY_NAME" \
    --region "$REGION" \
    --query 'KeyMaterial' \
    --output text > "$KEY_FILE"
  chmod 600 "$KEY_FILE"
  echo "      Saved to $KEY_FILE"
fi

# ── 2. Security group ────────────────────────────────────────────────────────
echo "[2/7] Creating security group..."
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=$SG_NAME" \
  --region "$REGION" \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || echo "None")

if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
  SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "MediRisk App Security Group" \
    --region "$REGION" \
    --query 'GroupId' \
    --output text)

  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --region "$REGION" \
    --ip-permissions \
    '[
      {"IpProtocol":"tcp","FromPort":22,"ToPort":22,"IpRanges":[{"CidrIp":"0.0.0.0/0","Description":"SSH"}]},
      {"IpProtocol":"tcp","FromPort":80,"ToPort":80,"IpRanges":[{"CidrIp":"0.0.0.0/0","Description":"HTTP"}]},
      {"IpProtocol":"tcp","FromPort":3000,"ToPort":3000,"IpRanges":[{"CidrIp":"0.0.0.0/0","Description":"Backend API"}]}
    ]' > /dev/null
  echo "      Created security group: $SG_ID"
else
  echo "      Reusing existing security group: $SG_ID"
fi

# ── 3. AMI (Amazon Linux 2023) ────────────────────────────────────────────────
echo "[3/7] Looking up latest Amazon Linux 2023 AMI..."
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters \
    'Name=name,Values=al2023-ami-2023*-x86_64' \
    'Name=state,Values=available' \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text \
  --region "$REGION")
echo "      AMI: $AMI_ID"

# ── 4. Launch instance ────────────────────────────────────────────────────────
echo "[4/7] Launching EC2 instance ($INSTANCE_TYPE)..."
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id "$AMI_ID" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --region "$REGION" \
  --user-data "$(cat "$SCRIPT_DIR/ec2-bootstrap.sh")" \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=medirisk-app}]' \
  --query 'Instances[0].InstanceId' \
  --output text)
echo "      Instance ID: $INSTANCE_ID"

echo "      Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"

# ── 5. Get public IP ──────────────────────────────────────────────────────────
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --region "$REGION" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)
echo "[5/7] Public IP: $PUBLIC_IP"

# Save for later use
cat > "$SCRIPT_DIR/instance-info.txt" << EOF
INSTANCE_ID=$INSTANCE_ID
PUBLIC_IP=$PUBLIC_IP
REGION=$REGION
KEY_FILE=$KEY_FILE
EOF

# ── 6. Production .env ────────────────────────────────────────────────────────
echo "[6/7] Generating production .env..."
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 32)

cat > "$SCRIPT_DIR/.env.production" << EOF
PORT=3000
NODE_ENV=production

DB_HOST=postgres
DB_PORT=5432
DB_NAME=medirisk
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=1d

CORS_ORIGIN=http://$PUBLIC_IP
FRONTEND_PORT=80
VITE_API_URL=http://$PUBLIC_IP

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
echo "      Saved to deploy/.env.production"

# ── 7. Deploy ─────────────────────────────────────────────────────────────────
echo "[7/7] Waiting for EC2 bootstrap to finish (~90s)..."
sleep 90

# Wait for SSH to be ready
echo "      Connecting to EC2..."
for i in {1..15}; do
  if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
      ec2-user@"$PUBLIC_IP" "test -f /home/ec2-user/bootstrap-done.txt" 2>/dev/null; then
    echo "      Bootstrap confirmed."
    break
  fi
  echo "      Not ready yet, retrying in 15s... ($i/15)"
  sleep 15
done

# Copy .env to EC2
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no \
  "$SCRIPT_DIR/.env.production" ec2-user@"$PUBLIC_IP":/home/ec2-user/medirisk/.env

# Run docker compose on EC2
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no ec2-user@"$PUBLIC_IP" << 'ENDSSH'
cd /home/ec2-user/medirisk
docker compose up --build -d
echo "Docker compose started."
ENDSSH

echo ""
echo "=========================================="
echo " Deployment complete!"
echo "=========================================="
echo " App URL:  http://$PUBLIC_IP"
echo " SSH:      ssh -i deploy/$KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo " Logs:     ssh in, then: docker compose logs -f"
echo "=========================================="
