#!/bin/bash
# EC2 user-data: runs once on first boot as root
set -euo pipefail

# Update system
dnf update -y

# Install Docker
dnf install -y docker git
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Docker Compose plugin
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Clone the repo
git clone https://github.com/voidrlm/capstone.git /home/ec2-user/medirisk
chown -R ec2-user:ec2-user /home/ec2-user/medirisk

echo "Bootstrap complete" > /home/ec2-user/bootstrap-done.txt
