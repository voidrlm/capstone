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

# 1. KEY PAIR
if [ ! -f "$KEY_FILE" ]; then
  echo "Creating key pair..."
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

# 3. AMI LOOKUP
echo "Looking up AMI..."
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters 'Name=name,Values=al2023-ami-2023*-x86_64' 'Name=state,Values=available' \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text \
  --region "$REGION")

# USERDATA SCRIPT TO INSTALL DOCKER/GIT ON ALL INSTANCES
cat > "$SCRIPT_DIR/bootstrap-common.sh" << 'EOF'
#!/bin/bash
sudo dnf update -y
sudo dnf install -y docker git expect postgresql
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo dnf install -y nodejs npm
touch /home/ec2-user/bootstrap-done.txt
EOF

# FUNCTION TO PROVISION OR GET EXISTING INSTANCE
get_or_create_instance() {
  local role=$1
  local instance_name="${PREFIX}-${role}"

  # Check if instance already running
  local inst_id=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$instance_name" "Name=instance-state-name,Values=running,pending" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text 2>/dev/null)

  if [ "$inst_id" = "None" ] || [ -z "$inst_id" ] || [ "$inst_id" = "null" ]; then
    echo "Launching $role instance..."
    inst_id=$(aws ec2 run-instances \
      --image-id "$AMI_ID" \
      --instance-type "$INSTANCE_TYPE" \
      --key-name "$KEY_NAME" \
      --security-group-ids "$SG_ID" \
      --region "$REGION" \
      --user-data "$(cat "$SCRIPT_DIR/bootstrap-common.sh")" \
      --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$instance_name}]" \
      --query 'Instances[0].InstanceId' \
      --output text)
  else
    echo "Found existing $role instance: $inst_id"
  fi

  echo $inst_id
}

# 4. PROVISION INSTANCES
DB_ID=$(get_or_create_instance "database")
BE_ID=$(get_or_create_instance "backend")
FE_ID=$(get_or_create_instance "frontend")

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

JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c 32)

# ================= DATABASE SETUP =================
echo "Deploying Database..."
ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' -o 'ConnectTimeout=10' ec2-user@"$DB_PUB" << EOF
  while [ ! -f /home/ec2-user/bootstrap-done.txt ]; do sleep 5; done
  cat > docker-compose.yml << 'DOCKER'
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: medirisk
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
DOCKER
  sudo docker-compose up -d
EOF

# ================= BACKEND SETUP =================
echo "Deploying Backend..."
# Wait for bootstrap and copy files
ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$BE_PUB" 'while [ ! -f /home/ec2-user/bootstrap-done.txt ]; do sleep 5; done; mkdir -p /home/ec2-user/medirisk'
echo "Syncing code to Backend Instance..."
rsync -avz -e "ssh -i $KEY_FILE -o StrictHostKeyChecking=no" --exclude 'node_modules' --exclude '.git' --exclude 'dist' "$SCRIPT_DIR/" ec2-user@"$BE_PUB":/home/ec2-user/medirisk/

ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$BE_PUB" << EOF
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
CORS_ORIGIN=http://$FE_PUB
FRONTEND_URL=http://$FE_PUB
ENV
  cd medirisk/backend
  # Install deps and start
  npm install
  npm run build || true
  npx pm2 start dist/index.js --name backend || sudo docker build -t backend . && sudo docker run -d -p 3000:3000 --env-file .env backend
EOF

# ================= FRONTEND SETUP =================
echo "Deploying Frontend..."
# Wait for bootstrap and copy files
ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$FE_PUB" 'while [ ! -f /home/ec2-user/bootstrap-done.txt ]; do sleep 5; done; mkdir -p /home/ec2-user/medirisk'
echo "Syncing code to Frontend Instance..."
rsync -avz -e "ssh -i $KEY_FILE -o StrictHostKeyChecking=no" --exclude 'node_modules' --exclude '.git' --exclude 'dist' "$SCRIPT_DIR/" ec2-user@"$FE_PUB":/home/ec2-user/medirisk/

ssh -i "$KEY_FILE" -o 'StrictHostKeyChecking=no' ec2-user@"$FE_PUB" << EOF
  cat > /home/ec2-user/medirisk/frontend/.env << 'ENV'
VITE_API_URL=http://$BE_PUB:3000
ENV
  cd medirisk/frontend
  # Install deps, build and serve
  npm install
  npm run build || true
  sudo docker build -t frontend -f ../Dockerfile.frontend --build-arg VITE_API_URL=http://$BE_PUB:3000 .
  sudo docker run -d -p 80:80 frontend
EOF

echo ""
echo "=========================================="
echo " Architecture Deployed Successfully!      "
echo "=========================================="
echo " - Frontend URL: http://$FE_PUB"
echo " - Backend URL:  http://$BE_PUB:3000"
echo " - DB Internal:  $DB_PRIV:5432"
